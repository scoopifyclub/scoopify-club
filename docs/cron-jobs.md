# Cron jobs

Scheduled work runs on **Vercel Cron**, defined in `vercel.json`. Vercel calls
each path with `GET` and `Authorization: Bearer $CRON_SECRET` on the production
deployment only. The schedule fits the **Hobby** plan: every job runs at most
once a day, and Hobby fires it at some point within the scheduled hour.

| Route | Schedule (UTC) | Denver time (Hobby fires within the hour) | What it does |
|---|---|---|---|
| `/api/cron/create-weekly-services` | `0 11 * * *` | 4:00–4:59 MST / 5:00–5:59 MDT | Creates recurring visits for the next 7 days |
| `/api/cron/open-job-pool` | `0 12 * * *` | 5:00–5:59 MST / 6:00–6:59 MDT | Releases expired claims, rolls overdue unclaimed visits onto today |
| `/api/cron/process-employee-payouts` | `0 16 * * 5` | Fri 9:00–9:59 MST / 10:00–10:59 MDT | **Report only**; see Payouts below |

Both daily jobs finish before the 7:00 visit start even at the end of their
hour, and they don't depend on each other's order.

### Vercel Hobby limits (checked 2026-11-09)

From [Vercel's cron usage docs](https://vercel.com/docs/cron-jobs/usage-and-pricing):
Hobby allows 100 cron jobs per project, each at most **once per day**, with
per-hour precision (a `0 11 * * *` job runs between 11:00 and 11:59 UTC). A
more frequent expression **fails the deployment**. Pro allows per-minute
schedules. The job count is not a constraint here (3 of 100), so each route
keeps its own entry instead of going through a dispatcher route.
`npm run test:cron` fails if any entry in `vercel.json` would run more than
once a day.

## Claim release (45-minute window)

There is no frequent Vercel cron on Hobby, so expired claims are released by:

1. **Lazy release.** Every job feed, claim and check-in runs
   `releaseExpiredClaims()` first (PR #4). An abandoned job comes back as soon
   as any scooper loads a feed or tries to claim, and the late scooper gets
   403 on check-in.
2. **The daily `open-job-pool` run**, which releases before rolling overdue
   jobs forward.
3. **Admin, on demand.** Click "Release Now" on `/admin/test-services`, or
   `POST /api/cron/release-expired-claims` with an admin session. With the
   secret:
   `APP_URL=https://www.scoopify.club CRON_SECRET=... npm run cron:run -- release-expired-claims`.
4. **Optional free 15-minute schedule**,
   `.github/workflows/claim-release.yml`. It is off until the repository
   variable `ENABLE_CLAIM_RELEASE_CRON` is `true`, and it needs the
   `VERCEL_URL` and `CRON_SECRET` repository secrets. Actions minutes are free
   for public repos. GitHub disables scheduled workflows after 60 days without
   repository activity, so a weekly keepalive job calls the "enable workflow"
   API to reset that timer. If the workflow gets disabled anyway, GitHub
   emails the repo admins, and someone re-enables it under Actions. Scheduled
   runs can also start late or be skipped when GitHub is busy. The lazy
   release (1) covers those gaps.

On Pro, `{ "path": "/api/cron/release-expired-claims", "schedule": "*/5 * * * *" }`
can go back into `vercel.json`, and the GitHub workflow can be turned off.

Cron expressions are UTC, so Denver times shift by an hour with DST. All
calendar logic (today, service day, weeks) uses America/Denver in code
(`src/lib/business-time.js`), so the shift only moves when a job runs.

## Auth

Every `/api/cron/*` route calls `requireCronOrAdmin()` (`src/lib/cron-auth.js`):

- `Authorization: Bearer $CRON_SECRET`, compared in constant time; or
- a verified admin session (`requireAdmin()`), for the admin "run now" buttons.

The secret is never read from `?secret=`, the request body or `x-api-key`. If
`CRON_SECRET` is unset, only admins get in. `CRON_API_KEY` and
`NEXT_PUBLIC_CRON_SECRET` are no longer used.

## Recurring visits

`createRecurringServices()` (`src/lib/recurring-services.js`) is the single
generator used by `create-weekly-services`, the legacy `schedule-services` and
the admin bulk `POST /api/services/schedule`.

- Source: `Subscription.status = ACTIVE`, `endDate` empty or not yet passed,
  plan type not `ONE_TIME`.
- Day: `Customer.serviceDay` (`monday` or `Monday` etc.). Subscriptions without
  a valid day get no visits and are listed in the response and in a
  `RECURRING_SERVICE_NO_DAY` SystemLog row.
- Time: 07:00 America/Denver on that date. The window starts today, or tomorrow
  once 07:00 has passed, and covers 7 days (`?days=N`, up to 35, for backfill).
- Visits are not created before the subscription's `startDate` or after its
  `endDate`.
- `potentialEarnings` uses `calculateMonthlyServicePayment(plan.price)` (75% of
  the post-Stripe-fee amount, divided by 4). Referral deductions are not applied.

**No duplicates.** Each visit stores `subscriptionId` and `serviceDate` (the
Denver date it was generated for). A unique index on that pair (migration
`20261110020000_recurring_service_schedule`) and `createMany({ skipDuplicates })`
make re-runs and concurrent runs no-ops. `serviceDate` is not changed when
`open-job-pool` rolls a visit onto a later day, so the rolled visit is not
recreated. A subscription that already has a visit in a Monday–Sunday week
does not get a second one that week, for example after the customer changes
their service day. The visit already created on the old day stays where it
is; moving it is not handled here.

Since PR #3 the Stripe webhook no longer creates visits. It only keeps
`Subscription` rows current, and this job turns them into visits.

## Payouts

Automatic scooper payouts are **not implemented**. The old route created
`Payout` rows, marked services `PAID` and notified scoopers using a mocked
Stripe transfer (a sleep and a fake `stripe_*` ID), and it crashed on schema
errors before getting that far.

`process-employee-payouts` now only reports. It lists completed services from
the previous Denver week (Monday–Sunday) that are still `paymentStatus =
PENDING`, grouped by scooper with the amount owed. It returns
`payoutsEnabled: false` and writes a `PAYOUT_REPORT` SystemLog row. It moves no
money and does not change `Service`, `Earning` or `Payout` rows. Pay scoopers
manually until real Stripe Connect transfers are built (backlog item 24).

## Not scheduled

These routes require the same auth but are not in `vercel.json`. They
reference tables or fields that do not exist (see the schema mismatch list),
or nobody has checked them yet:
`automated-customer-acquisition`, `automated-employee-recruitment`,
`business-intelligence`, `cleanup-photos`, `payment-reconciliation`,
`payment-retry`, `process-referrals`, `retry-payments`,
`send-customer-notifications`, `send-service-reminders`, `schedule-services`.

## Why Vercel Cron for the daily jobs

- GitHub disables scheduled workflows after 60 days without repository
  activity. That already happened to `cron.yml` (`disabled_inactivity`), and
  this repo can go months without commits. Vercel Cron belongs to the
  deployment and keeps running. Visit creation is the one job that must not
  stop silently.
- GitHub schedules are best-effort and are often late.
- Vercel sends `Authorization: Bearer $CRON_SECRET` itself, and the schedule
  ships and rolls back with the code.

Trade-offs:

- Hobby: daily only, timing within the hour (fits, see above). Hobby's terms
  also limit it to non-commercial use, so move to Pro once revenue allows.
- Vercel does not retry failed runs and may occasionally run a job twice.
  Every scheduled job here is idempotent, and the daily jobs pick up a missed
  day on the next run.

`.github/workflows/cron.yml` is now a manual workflow (no schedule, so it is
never auto-disabled) for running a job on demand from the Actions tab. It
needs the `VERCEL_URL` (e.g. `https://www.scoopify.club`) and `CRON_SECRET`
repository secrets. From a shell:

```bash
APP_URL=https://www.scoopify.club CRON_SECRET=... npm run cron:run -- create-weekly-services
```

## Deploy steps

1. Set `CRON_SECRET` for the Production environment in Vercel. Use at least
   32 random characters (`openssl rand -hex 32`). Remove `CRON_API_KEY` and
   any `NEXT_PUBLIC_CRON_SECRET`.
2. Deploy. `prisma migrate deploy` applies
   `20261110020000_recurring_service_schedule`. The migration only adds
   nullable columns, so existing rows cannot conflict.
3. In Vercel, under Settings > Cron Jobs, check that the three jobs are listed.
   Use "Run" on `create-weekly-services`, and check that it returns 200 and
   that `missingServiceDay` is empty.
4. Optional: set the `VERCEL_URL` and `CRON_SECRET` repository secrets on
   GitHub, then enable the "Run cron job manually" workflow in the Actions tab.
   It was auto-disabled, and GitHub keeps it disabled until someone enables it.
5. Optional, for 15-minute claim release: with the same two secrets set, add
   the repository variable `ENABLE_CLAIM_RELEASE_CRON=true` (Settings >
   Secrets and variables > Actions > Variables). Then run "Release expired
   claims" once from the Actions tab and check that it returns 200.

## Tests

```bash
npm run test:cron   # auth for every cron route, scheduler wiring, Denver date math
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/scoopify_cron_test npm run test:cron
```

With `TEST_DATABASE_URL` set (a local database whose name contains `test`;
it is truncated), the suite also runs the real-Postgres tests. They cover
two sequential runs and six concurrent runs creating no duplicates, the
preferred day and Denver time across DST, which subscriptions are included,
rollover, and a payout report that pays nothing.
