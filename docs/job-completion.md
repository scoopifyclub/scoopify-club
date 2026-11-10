# Job photos, completion and the financial record

How a scooper documents and completes a job, who can see the photos, and what
is recorded when a job is done. Logic lives in `src/lib/service-photos.js`,
`src/lib/job-completion.js` and `src/lib/job-financials.js`; the routes below
delegate to them. Claiming and check-in are in `docs/job-claiming.md`.

## Photos

- **Who uploads.** Only the scooper assigned to the job, and only while it is
  checked in (`IN_PROGRESS`). Before check-in the API returns 409
  `NOT_CHECKED_IN`; anyone else gets 403 (other scooper) or 401 (not a scooper).
- **Types.** `PhotoType` is `BEFORE`, `AFTER`, `ISSUE` or `OTHER`. Older client
  names are mapped: `PRE_SERVICE`/`PRE_CLEAN` to `BEFORE`, `POST_SERVICE`/`POST_CLEAN`
  to `AFTER`, `GATE` to `OTHER`.
- **Validation.** JPEG, PNG, WebP or HEIC only. The declared type must match the
  file's leading bytes (so a renamed text or SVG file is rejected with 415).
  Up to 10 MB per photo and 16 photos per job.
- **Storage.** Private S3 objects under `services/<serviceId>/<type>/<uuid>.<ext>`,
  SSE-S3 encrypted, never with a public ACL. `ServicePhoto.s3Key` holds the key;
  the API never returns it or a public URL.
- **Viewing.** The assigned scooper, the job's customer and verified admins get
  signed GET URLs that expire after 5 minutes (`urlExpiresAt` in each photo).
  Everyone else gets 403, including other scoopers, other customers and a
  scooper whose claim was released. Public share links (`/api/photos/share`) are
  disabled (410).

Two ways to upload:

1. **Through the API** (photos up to 4 MB, because Vercel rejects function
   request bodies over 4.5 MB): `POST /api/employee/services/<id>/photos` as
   `multipart/form-data` with `file` and `type`.
2. **Directly to S3** (up to 10 MB):
   1. `POST /api/employee/services/<id>/photos/upload-url` with
      `{ type, contentType, size }`. The response has `uploadUrl`, `key` and
      `headers`; the URL expires after 5 minutes.
   2. `PUT` the file to `uploadUrl` with exactly those `headers`
      (`Content-Type` and `x-amz-server-side-encryption: AES256`).
   3. `POST /api/employee/services/<id>/photos` with JSON `{ key, type }`. The
      server checks the object's size, type and leading bytes, deletes it if
      invalid, and records it. Confirming the same key twice is a no-op.

## Completion

`POST /api/employee/services/<id>/complete` with
`{ checklist, notes }`, as the assigned scooper.

- **Requirements.** The job is `IN_PROGRESS` (checked in). The checklist has
  `allWasteRemoved` and `gateClosed` checked (from the request or saved earlier
  with `POST /api/services/<id>/checklist`). At least 4 `BEFORE` and 4 `AFTER`
  photos are stored in S3. Missing items return 400 `CHECKLIST_INCOMPLETE` or
  `PHOTOS_REQUIRED` with what is missing.
## Service credits

Each visit uses at most one of the customer's service credits. `Service.creditUsedAt`
marks that the credit was taken:

- **One-off booking** (`POST /api/customer/services`): uses the credit when the
  visit is created. Completing that visit does not use another.
- **Scheduled / recurring visits** (no credit at booking): uses the credit when
  the visit is completed.
- Completing a visit with no credits left still completes; a
  `SERVICE_CREDIT_UNAVAILABLE` SystemLog row is written and credits stay at zero.

`useServiceCredit()` in `src/lib/service-credits.js` is the only place that
decrements `Customer.serviceCredits` for a visit.

- **What happens.** In one transaction: status `COMPLETED`,
  `workflowStatus = COMPLETED`, `completedDate`, `checklistCompleted`, the photo
  ids, the checklist (scooper notes go to `ServiceChecklist.notes`; the
  customer's `Service.notes` is left alone), one `JobFinancialRecord`, one
  `Earning`, `Employee.completedJobs + 1`, and one customer service credit used
  (never below zero). Then an in-app notification and the customer email.
- **Idempotent.** The status change is conditional (`IN_PROGRESS` to
  `COMPLETED`), and `JobFinancialRecord.serviceId` and `Earning.serviceId` are
  unique. Repeated or concurrent calls return 200 with `alreadyCompleted: true`
  and record nothing new; only the call that completed the job sends the email.
- **Next job.** `COMPLETED` is not an active status, so the scooper's
  one-active-job slot is free immediately.
- **Email.** Sent through the existing SMTP service (`src/lib/unified-email-service.js`)
  with before/after photos as signed links valid for 7 days (the S3 maximum);
  `GET /api/services/<id>/photos` always returns fresh links. When `SMTP_PASSWORD` is unset the email
  is skipped, not failed. Every outcome (`sent`, `skipped`, `failed`) is written
  to `SystemLog` as `SERVICE_COMPLETION_EMAIL`. A failed email does not undo the
  completion.

Routes that complete a job all use the same function:
`/api/employee/services/<id>/complete`, `/api/services/<id>/complete`, and
`/api/employee/services/<id>/status` with `status: COMPLETED` (`ARRIVED` /
`IN_PROGRESS` on that route is a normal check-in).

## Financial record

One `JobFinancialRecord` per completed job, written in the completion
transaction. All amounts are integer cents.

| Field | Meaning |
|---|---|
| `pricingBasis` | `SUBSCRIPTION_WEEKLY` or `ONE_TIME` (from the plan's `type`) |
| `planPriceCents` | The plan price (monthly price for subscriptions) |
| `customerPriceCents` | Price allocated to this visit: monthly price x 12 / 52, or the one-time price |
| `scooperEarningCents` | 75% of `customerPriceCents` |
| `referralExpenseCents` | 0; set later by an adjustment when a referral reward applies |
| `stripeFeeCents` | Card fee on the charge (2.9% + $0.30), allocated the same way (x 12 / 52 for subscriptions). Scoopify absorbs it |
| `stripeFeeEstimated` | `true` while the fee is the standard-rate estimate |
| `retainedContributionCents` | `customerPriceCents - scooperEarningCents - referralExpenseCents - stripeFeeCents` |
| `adjustments` | History: `[{ at, by, reason, changes: { field: { from, to } } }]` |
| `checkedInAt`, `completedAt`, `serviceDurationSeconds` | Check-in to completion |
| `payoutStatus`, `stripeTransferId`, `paidAt` | Owned by the payouts worker; start as `PENDING`, null, null |

Example, $79/month plan: price allocation $18.23, scooper $13.67, Stripe fee
$0.60, retained $3.96.

The subscription's plan is used when the visit belongs to a subscription,
otherwise the job's plan. If the plan has no price, no record or earning is
written and an `EARNING_AMOUNT_MISSING` SystemLog row is logged.

Change amounts only with `adjustFinancialRecord({ serviceId, changes, reason, by })`
(`src/lib/job-financials.js`). It locks the row, recomputes the retained
contribution, appends to `adjustments`, and refuses records that already have a
`stripeTransferId`.

For the payouts worker: build transfers from rows with `payoutStatus = 'PENDING'`
and `stripeTransferId IS NULL`, transfer `scooperEarningCents`, use the record
`id` as the Stripe idempotency key, and set `stripeTransferId`, `payoutStatus`
and `paidAt`. The `Earning` row (same amount, in dollars) is kept for the
existing earnings screens.

`potentialEarnings` on new recurring visits uses the same formula, so the pay a
scooper sees in the job feed matches what is recorded.

## Admin

- `GET /api/admin/services/<id>/completion`: status and timestamps, checklist,
  photos (5-minute signed URLs), financial record, earning and email log.
- `GET /api/admin/photos?serviceId=&employeeId=`, `DELETE /api/admin/photos?id=`.
- `GET /api/admin/services/photos?date=` and `/api/admin/photos/map`: completed
  jobs and photos by date, with signed URLs.

## Production setup

**S3 bucket** (one bucket; `AWS_BUCKET_NAME` is the only bucket variable read;
`AWS_S3_BUCKET` and `S3_BUCKET_NAME` are no longer used):

1. Turn on all four Block Public Access settings for the bucket and keep Object
   Ownership on "Bucket owner enforced" (ACLs disabled). Then a direct object
   URL returns 403.
2. Default encryption: SSE-S3.
3. Bucket policy that refuses plain HTTP:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Sid": "DenyInsecureTransport",
       "Effect": "Deny",
       "Principal": "*",
       "Action": "s3:*",
       "Resource": ["arn:aws:s3:::BUCKET", "arn:aws:s3:::BUCKET/*"],
       "Condition": { "Bool": { "aws:SecureTransport": "false" } }
     }]
   }
   ```

4. The IAM user whose keys are in `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
   needs only:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
       "Resource": "arn:aws:s3:::BUCKET/services/*"
     }]
   }
   ```

5. CORS, for the direct upload (`<img>` tags need no CORS):

   ```json
   [{
     "AllowedOrigins": ["https://scoopify.club", "https://www.scoopify.club"],
     "AllowedMethods": ["PUT"],
     "AllowedHeaders": ["content-type", "x-amz-server-side-encryption"],
     "ExposeHeaders": ["ETag"],
     "MaxAgeSeconds": 3000
   }]
   ```

   Add a preview origin only if previews use the production bucket.

6. Set `AWS_REGION` to the bucket's region.

**Email:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`
and `NEXT_PUBLIC_APP_URL` (used for the dashboard links). Without
`SMTP_PASSWORD`, completion emails are skipped and logged.

**Migrations:** `20261110030000_service_photos_and_completion` makes
`Earning.serviceId` unique and `20261110040000_job_financial_record` adds the
table. Before deploying, check that production has no duplicate earnings
(otherwise the first migration fails and the build stops):

```sql
SELECT "serviceId", count(*) FROM "Earning" GROUP BY 1 HAVING count(*) > 1;
```

## Tests

`npm run test:completion` (needs `TEST_DATABASE_URL` for the DB suite, like
`npm run test:claims`). S3 is replaced by an in-memory store; signed URLs come
from the real AWS presigner.
