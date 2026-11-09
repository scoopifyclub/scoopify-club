# Job claiming

How scoopers claim, hold and check in to jobs. The logic lives in
`src/lib/job-claims.js`; every route below delegates to it.

## Lifecycle

| State | `Service.status` | `employeeId` | Other fields |
|---|---|---|---|
| Unclaimed | `SCHEDULED` | null | `workflowStatus = AVAILABLE` |
| Claimed | `PENDING` | set | `workflowStatus = CLAIMED`, `claimedAt`, `arrivalDeadline = claimedAt + 45 min` |
| Checked in | `IN_PROGRESS` | set | `workflowStatus = ARRIVED`, `arrivedAt` |
| Done | `COMPLETED` | set | |

A claim that is not checked in by `arrivalDeadline` is released back to
Unclaimed and a `JOB_CLAIM_EXPIRED` row is written to `SystemLog`.

## Rules

- **Approval.** A scooper can list, claim or check in only when
  `Employee.status = ACTIVE` and `Employee.approvedAt` is set. New signups are
  pending. Admins approve with `POST /api/admin/employees/<employeeId>/approval`
  and revoke with `DELETE` on the same path. `GET /api/admin/employees?approval=pending`
  lists who is waiting.
- **Atomic claim.** The job is taken with a conditional update
  (`employeeId IS NULL AND status = 'SCHEDULED'`), so concurrent claims on one
  job produce one success and 409 for the rest.
- **One active job.** The scooper's Employee row is locked for the duration of
  the claim, and the `Service_one_active_job_per_employee` partial unique index
  (in the `20261110000000_job_claiming` migration, not in `schema.prisma`)
  rejects a second `PENDING`/`IN_PROGRESS` job for the same scooper from any
  code path.
- **Access details.** Unclaimed-job feeds return only the customer's first name
  and city/state/ZIP. Gate code, street address, phone and notes are returned
  only to the assigned scooper while the job is claimed or in progress: in the
  claim and check-in responses, `GET /api/employee/services/<id>/access` and
  `GET /api/services/<id>`. Each reveal writes a `GATE_CODE_REVEALED` SystemLog row.
- **Check-in.** Only the assigned scooper, before the deadline. When the job has
  a `Location`, the request must include `latitude`/`longitude` within 0.25 miles.

## Endpoints

| Endpoint | Purpose |
|---|---|
| `POST /api/employee/services/<id>/claim` | Claim (scooper app) |
| `POST /api/employee/jobs/<jobId>/claim` | Claim (job pool and map) |
| `POST /api/employee/services/<id>/arrive`, `.../checkin`, `/api/employee/jobs/<jobId>/checkin`, `/api/services/<id>/arrive` | Check in |
| `GET /api/employee/services/<id>/access` | Gate code etc. for the assignee |
| `GET\|POST /api/cron/release-expired-claims` | Release expired claims |
| `POST /api/cron/open-job-pool` | Daily: release expired claims, roll overdue unclaimed jobs onto today |

Scooper routes accept the `accessToken` cookie or `Authorization: Bearer <token>`.

## Expiry schedule

`/api/cron/release-expired-claims` accepts `Authorization: Bearer $CRON_SECRET`
(or a verified admin session) and should run every 5 minutes. It is not
scheduled yet; wiring it into the cron workflow is a separate task. Until then
claim, check-in and every job feed run the same release first, so an abandoned
job reappears the next time any scooper loads a feed or claims.

## Production steps

1. Before deploying, check that no scooper holds two active jobs, or the
   migration's unique index fails (and so does the Vercel build):
   `DATABASE_URL=... node scripts/scooper-approvals.js active-jobs-check`
2. Deploy. `prisma migrate deploy` applies `20261110000000_job_claiming`.
3. Every existing scooper is now pending. List them and approve the real ones:
   `node scripts/scooper-approvals.js list` then
   `node scripts/scooper-approvals.js approve <email> --apply`.
4. Schedule `/api/cron/release-expired-claims` every 5 minutes with
   `CRON_SECRET` set.

## Tests

`npm run test:claims` with `TEST_DATABASE_URL` set to a local, disposable
Postgres database whose name contains `test` (the suite truncates tables):

```bash
createdb scoopify_claims_test
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/scoopify_claims_test npm run test:claims
```
