# Cron jobs

Scheduled work runs on **Vercel Cron**, defined in `vercel.json`. Vercel calls
each path with `GET` and `Authorization: Bearer $CRON_SECRET` on the production
deployment only.

| Route | Schedule (UTC) | Denver time | What it does |
|---|---|---|---|
| `/api/cron/release-expired-claims` | `*/5 * * * *` | every 5 min | Requeues claims not checked in within 45 minutes |
| `/api/cron/create-weekly-services` | `0 11 * * *` | 4:00 MST / 5:00 MDT | Creates recurring visits for the next 7 days |
| `/api/cron/open-job-pool` | `0 12 * * *` | 5:00 MST / 6:00 MDT | Releases expired claims, rolls overdue unclaimed visits onto today |
| `/api/cron/process-employee-payouts` | `0 16 * * 5` | Fri 9:00 MST / 10:00 MDT | **Report only**; see Payouts below |

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
- `potentialEarnings` is the scooper's pay per visit: monthly price x 12 / 52 x 75%
  (`src/lib/job-financials.js`; Scoopify absorbs Stripe fees). The amount actually
  owed is fixed at completion in `JobFinancialRecord` (see `docs/job-completion.md`).

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

## Why Vercel Cron and not GitHub Actions

- GitHub disables scheduled workflows after 60 days without repository
  activity. That already happened to `cron.yml` (`disabled_inactivity`), and
  this repo can go months without commits. Vercel Cron belongs to the
  deployment and keeps running.
- GitHub schedules are best-effort. Runs are often late, especially at
  frequent intervals, which suits a 5-minute claim-expiry job badly.
- Vercel sends `Authorization: Bearer $CRON_SECRET` itself, so no
  `VERCEL_URL` or secret has to be copied into GitHub for scheduled runs, and
  the schedule ships and rolls back with the code.

Trade-offs:

- **The 5-minute job needs a Vercel Pro (or Enterprise) plan.** Hobby allows
  only daily crons, fires them anywhere within the scheduled hour, and *fails
  the deployment* when `vercel.json` has a more frequent expression. Hobby is
  also limited to non-commercial use. If the project is on Hobby, upgrade it.
  Otherwise, change `release-expired-claims` to a daily schedule before
  deploying and rely on the lazy release that every feed, claim and check-in
  already runs.
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

1. Confirm the Vercel plan is Pro (see trade-offs).
2. Set `CRON_SECRET` for the Production environment in Vercel. Use at least
   32 random characters (`openssl rand -hex 32`). Remove `CRON_API_KEY` and
   any `NEXT_PUBLIC_CRON_SECRET`.
3. Deploy. `prisma migrate deploy` applies
   `20261110020000_recurring_service_schedule`. The migration only adds
   nullable columns, so existing rows cannot conflict.
4. In Vercel, under Settings > Cron Jobs, check that the four jobs are listed.
   Use "Run" on `create-weekly-services`, and check that it returns 200 and
   that `missingServiceDay` is empty.
5. Optional: set the `VERCEL_URL` and `CRON_SECRET` repository secrets on
   GitHub, then enable the "Run cron job manually" workflow in the Actions tab.
   It was auto-disabled, and GitHub keeps it disabled until someone enables it.

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
