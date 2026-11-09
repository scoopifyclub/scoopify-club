# Scooper payouts

Scoopers are paid automatically by Stripe Connect transfer every Friday.
The logic lives in `src/lib/scooper-payouts.js` (earnings and transfers),
`src/lib/payout-holds.js` (refunds and disputes),
`src/lib/payout-reconciliation.js` and `src/lib/stripe-connect.js`.

## Pay rules

From `src/lib/payment-calculator.js`:

| Job | Scooper earns |
|---|---|
| Weekly club visit (plan type `MONTHLY`) | monthly price × 12 / 52 × 75% ($79 → $13.67) |
| One-time job (any other plan type, e.g. `ONE_TIME`, `INITIAL_CLEANUP`) | 75% of the price ($99 → $74.25) |

Scoopify keeps the rest and absorbs Stripe fees, Connect fees and referral
rewards; none of them is deducted from the scooper's share. The amount comes
from the job's plan when its earning is recorded. `Service.potentialEarnings`
is only the figure shown when the job was offered.

## Earnings ledger

A job earns pay once it is **verified complete**: `status = COMPLETED`, a
`completedDate`, an assigned scooper and at least one `AFTER` photo. Jobs
whose `Service.paymentStatus` is already `PAID` were paid by hand before this
existed and are never paid again.

Each verified job gets one `Earning` row (`kind = JOB`), unique per service.
A job's pay that has to be taken back after it was paid gets one negative
`kind = CLAWBACK` row.

| `Earning.status` | Meaning |
|---|---|
| `PENDING` | Owed; paid on the next Friday run once its week has ended |
| `HELD` | Owed, but a refund or dispute hold covers it |
| `PROCESSING` | Attached to a payout whose transfer is not confirmed yet |
| `PAID` | Transferred |
| `VOID` | Never payable (refunded or dispute lost before it was paid) |

## Weekly run

`/api/cron/process-employee-payouts` (Fridays, see [cron-jobs.md](cron-jobs.md))
calls `runPayouts()`:

1. Record earnings for verified jobs completed before this Monday (Denver)
   and apply holds.
2. Retry any `PROCESSING` or `FAILED` payout from an earlier run.
3. For each scooper with a positive balance of `PENDING` earnings and a
   Stripe account that can receive transfers, create one `Payout` for the
   period, attach the earnings and send one transfer.

A negative balance (clawbacks larger than new earnings) is carried forward.
A scooper who has not finished Stripe onboarding is reported as
`NEEDS_ONBOARDING`; their earnings stay `PENDING` and are paid on the first
run after Stripe enables payouts.

**No double payment.** `Payout` is unique on `(employeeId, weekStart)`, so
only one payout per scooper per period can exist. Earnings are attached with a
conditional update, so an earning belongs to at most one payout. The transfer
uses idempotency key `scooper-payout-<payoutId>` and `transfer_group
payout_<payoutId>`, and a retry first looks for an existing transfer in that
group, so a crash or lost response is safe even after Stripe's 24-hour
idempotency window. A failed payout is retried with the same earnings and
amount; jobs finished meanwhile wait for the next period.

**Switches.** Transfers happen only when `PAYOUTS_ENABLED=true`; otherwise the
run reports what it would pay. A live Stripe key (`sk_live_`/`rk_live_`) is
refused unless `PAYOUTS_ALLOW_LIVE=true` as well.

## Refunds and disputes

Holds are `PayoutHold` rows, created by the payouts webhook:

| Event | Effect |
|---|---|
| Full refund of a payment tied to one service (`Payment.serviceId`) | That job's pay is voided; if already paid, a clawback is deducted from the next payout |
| Any other refund (partial, or a subscription invoice) | Hold on the customer: none of their unpaid jobs are paid until an admin decides |
| Dispute opened | Hold on the customer |
| Dispute won | Hold released; held jobs are paid next run |
| Dispute lost | Tied to one service: that job's pay is voided or clawed back. Otherwise the hold stays open for an admin |

We claw back from future payouts instead of reversing transfers because a
scooper's Express balance is normally already paid out to their bank, so a
reversal would fail or leave a negative balance on an account we are liable
for.

Admins resolve holds with `GET/POST /api/admin/payouts/holds`:
`{ holdId, action: "release" }` or
`{ holdId, action: "void", serviceIds?: [...] }` (only the hold's customer's
services; without `serviceIds`, every job the hold covers).

## Endpoints

| Route | Who | What |
|---|---|---|
| `GET /api/employee/payouts` | scooper | Earnings, totals by status, holds, payouts, Stripe status, next payout date |
| `GET/POST /api/employee/stripe-connect` | approved scooper | `onboarding-link` (creates the Express account once), `refresh-status`, `dashboard-link`, `status` |
| `/employee/dashboard/payouts/return`, `/refresh` | scooper | Stripe onboarding return and refresh pages |
| `POST /api/webhooks/stripe-payouts` | Stripe | `account.updated`, `charge.refunded`, `charge.dispute.*` |
| `GET /api/admin/payouts/reconciliation?from&to` | admin | Revenue, Stripe fees, Connect fees, refunds, disputes, scooper and referral payouts, Scoopify margin; owed balances; mismatches |
| `GET/POST /api/admin/payouts/holds` | admin | List and resolve holds |

The old manual paths (`POST /api/earnings/payout`,
`POST /api/employee/payouts/request`) return 410.

## Stripe setup (test mode first)

1. **Connect platform.** Stripe Dashboard → Connect → get started, platform
   type "Platform", US. Complete the platform profile (Scoopify pays
   independent contractors for services they perform; Scoopify collects from
   customers and transfers to contractors).
2. **Express settings.** Connect → Settings: account type Express; country US;
   capability **Transfers** only (no card payments); brand name, icon and
   color;    Express payout schedule (default daily automatic is fine). If Scoopify
   will file 1099-NEC forms through Stripe, turn on Connect tax reporting so
   onboarding collects each scooper's TIN.
3. **Webhooks.** Developers → Webhooks, two endpoints at
   `https://<domain>/api/webhooks/stripe-payouts`:
   - "Listen to events on Connected accounts": `account.updated`. Signing
     secret → `STRIPE_CONNECT_WEBHOOK_SECRET`.
   - "Listen to events on your account": `charge.refunded`,
     `charge.dispute.created`, `charge.dispute.updated`,
     `charge.dispute.closed`. Signing secret → `STRIPE_PAYOUTS_WEBHOOK_SECRET`.
4. **Vercel env.** `STRIPE_CONNECT_WEBHOOK_SECRET`,
   `STRIPE_PAYOUTS_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL` (used for the
   onboarding return URL). Leave `PAYOUTS_ENABLED` unset until a test payout
   has been checked; then set `PAYOUTS_ENABLED=true`.
5. **Test balance.** Transfers draw from the platform's available balance. In
   test mode, charge card `4000 0000 0000 0077` to make funds available
   immediately.
6. **Going live** later: repeat 1–4 in live mode and also set
   `PAYOUTS_ALLOW_LIVE=true`.

## Tests

`npm run test:cron` (needs `TEST_DATABASE_URL`, see the test header) runs
`src/__tests__/cron/scooper-payouts.db.test.js`: pay rules, verified-only
earnings, report-only mode, one transfer per scooper, overlapping runs,
lost Stripe responses, declined transfers, onboarding, the live-key guard,
dispute holds, refund voids and clawbacks, admin hold resolution, the scooper
view, reconciliation and the cron and webhook routes.
