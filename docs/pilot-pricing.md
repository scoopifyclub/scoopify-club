# Pilot pricing

Provisional pilot pricing set on 2026-11-09. It is not final until 30+ completed cleanings. The amounts live in `src/lib/pricing-catalog.js`. Customers are always charged the Stripe Price whose ID is in the env var below. The catalog amount is shown only when Stripe can't be reached, and `/pricing` logs a warning if a Stripe Price doesn't match it.

## Prices

| Plan | Customer sees | Charged at checkout |
| --- | --- | --- |
| Weekly club, 1 / 2 / 3 dogs | $79 / $89 / $99 per month | Recurring monthly Stripe Price |
| One-time cleanup, 1 / 2 / 3 dogs | From $79 / $99 / $119 | One-time Stripe Price (the "from" amount) |
| Initial catch-up cleanup (new subscriptions) | From $49 | One-time Stripe Price, added to the first invoice |
| 4+ dogs, large or neglected yards, unusual access, remote addresses | "Request a quote" | Not sold online |

New subscribers prepay one month plus the catch-up cleanup at signup. There is no two-month upfront charge. Any yard that needs more than the starting price is handled by quote or admin approval, never in checkout.

Market-based pricing, promotions, and job quotes are managed in admin:

- `Market` / `MarketPrice` overlays by ZIP (new checkouts only; live subscriptions keep their Stripe Price)
- `Promotion` codes (`PERCENT`, `FIXED`, `FREE_CATCHUP`) applied at Checkout
- `Quote` requests for 4+ dogs or unusual yards — admin must approve a profitable amount before Checkout

Admin UI: `/admin/dashboard/pricing`. APIs under `/api/admin/pricing/**` and `/api/admin/quotes/**` (all `requireAdmin`). Public quote form: `/quote`.

## Stripe Prices to create

Create these in test mode first, then the same set in live mode. All are USD with standard (not tax-inclusive) pricing. Put each Price ID in the matching env var in Vercel.

| Env var | Product name | Type | Amount |
| --- | --- | --- | --- |
| `STRIPE_MONTHLY_1_DOG_PRICE_ID` | Weekly Club – 1 Dog | Recurring, monthly | $79.00 |
| `STRIPE_MONTHLY_2_DOGS_PRICE_ID` | Weekly Club – 2 Dogs | Recurring, monthly | $89.00 |
| `STRIPE_MONTHLY_3_PLUS_DOGS_PRICE_ID` | Weekly Club – 3 Dogs | Recurring, monthly | $99.00 |
| `STRIPE_ONETIME_1_DOG_PRICE_ID` | One-Time Cleanup – 1 Dog | One-time | $79.00 |
| `STRIPE_ONETIME_2_DOGS_PRICE_ID` | One-Time Cleanup – 2 Dogs | One-time | $99.00 |
| `STRIPE_ONETIME_3_PLUS_DOGS_PRICE_ID` | One-Time Cleanup – 3 Dogs | One-time | $119.00 |
| `STRIPE_INITIAL_CLEANUP_PRICE_ID` | Initial Catch-Up Cleanup | One-time | $49.00 |

The `_3_PLUS_` env names are kept so existing configuration keeps working. They hold the 3-dog price, because 4+ dogs are quoted.

If `STRIPE_INITIAL_CLEANUP_PRICE_ID` is unset, Checkout charges $49 as an inline price. A plan whose Price ID is unset shows "Not available yet".

To change a price later, create a new Stripe Price and swap the env var. Existing subscriptions stay on their old Price.
