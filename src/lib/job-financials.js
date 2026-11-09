import { randomUUID } from 'crypto';
import { prisma as defaultDb } from '@/lib/prisma';

// Money is stored in integer cents (Stripe transfers are in cents).
export const SCOOPER_SHARE = 0.75;
export const WEEKS_PER_YEAR = 52;
// Standard US card pricing. Scoopify absorbs Stripe fees, so they reduce the
// retained contribution, never the scooper's earning.
export const STRIPE_FEE_RATE = 0.029;
export const STRIPE_FEE_FIXED_CENTS = 30;

export class FinancialRecordError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FinancialRecordError';
  }
}

/**
 * How a visit is priced: one-time plans charge their price once; anything
 * else is a monthly subscription spread evenly over the weeks of a year
 * (monthly price x 12 / 52 per visit).
 */
export function pricingBasisFor(plan) {
  return String(plan?.type || '').toUpperCase() === 'ONE_TIME' ? 'ONE_TIME' : 'SUBSCRIPTION_WEEKLY';
}

/**
 * Allocation of one completed visit. Returns null when the plan has no
 * usable price.
 *   customerPriceCents        monthly price x 12 / 52, or the one-time price
 *   scooperEarningCents       75% of the customer price allocation
 *   referralExpenseCents      0 until a referral reward is assigned
 *   stripeFeeCents            estimated card fee on the charge, spread the same way
 *   retainedContributionCents price - earning - referral - Stripe fee
 */
export function allocateVisit(plan, { referralExpenseCents = 0 } = {}) {
  const price = Number(plan?.price);
  if (!Number.isFinite(price) || price <= 0) return null;
  const basis = pricingBasisFor(plan);
  const chargeCents = Math.round(price * 100);
  const chargeFeeCents = chargeCents * STRIPE_FEE_RATE + STRIPE_FEE_FIXED_CENTS;
  const share = basis === 'ONE_TIME' ? 1 : 12 / WEEKS_PER_YEAR;
  const customerPriceCents = Math.round(chargeCents * share);
  const scooperEarningCents = Math.round(customerPriceCents * SCOOPER_SHARE);
  const stripeFeeCents = Math.round(chargeFeeCents * share);
  return {
    pricingBasis: basis,
    planPriceCents: chargeCents,
    customerPriceCents,
    scooperEarningCents,
    referralExpenseCents,
    stripeFeeCents,
    retainedContributionCents: customerPriceCents - scooperEarningCents - referralExpenseCents - stripeFeeCents,
  };
}

/** Scooper pay for one visit of this plan, in dollars (what job feeds show). */
export function scooperEarningDollars(plan) {
  const allocation = allocateVisit(plan);
  return allocation ? allocation.scooperEarningCents / 100 : null;
}

/**
 * Builds the JobFinancialRecord row for a job completed at `completedAt`.
 * The subscription's plan is used when the visit belongs to a subscription.
 */
export function buildFinancialRecord({ service, completedAt }) {
  const plan = service.subscription?.servicePlan || service.servicePlan;
  const allocation = allocateVisit(plan);
  if (!allocation) return null;
  const checkedInAt = service.arrivedAt ? new Date(service.arrivedAt) : null;
  return {
    id: randomUUID(),
    serviceId: service.id,
    employeeId: service.employeeId,
    customerId: service.customerId,
    subscriptionId: service.subscriptionId ?? null,
    servicePlanId: plan.id ?? service.servicePlanId,
    ...allocation,
    stripeFeeEstimated: true,
    adjustments: [],
    checkedInAt,
    completedAt,
    serviceDurationSeconds: checkedInAt ? Math.max(0, Math.round((completedAt - checkedInAt) / 1000)) : null,
    createdAt: completedAt,
    updatedAt: completedAt,
  };
}

const ADJUSTABLE = ['customerPriceCents', 'scooperEarningCents', 'referralExpenseCents', 'stripeFeeCents'];

/**
 * Changes amounts on a job's financial record and appends the change to its
 * adjustment history ({ at, by, reason, changes: { field: { from, to } } }).
 * The retained contribution is recomputed. Records already paid out (with a
 * Stripe transfer) cannot be adjusted; that needs a reversal instead.
 */
export async function adjustFinancialRecord({ serviceId, changes, reason, by, now = new Date(), db = defaultDb }) {
  if (!reason) throw new FinancialRecordError('An adjustment needs a reason');
  const fields = Object.keys(changes || {});
  if (fields.length === 0 || fields.some((f) => !ADJUSTABLE.includes(f) || !Number.isInteger(changes[f]) || changes[f] < 0)) {
    throw new FinancialRecordError(`Adjust only ${ADJUSTABLE.join(', ')} with whole, non-negative cents`);
  }
  return db.$transaction(async (tx) => {
    const [record] = await tx.$queryRaw`SELECT * FROM "JobFinancialRecord" WHERE "serviceId" = ${serviceId} FOR UPDATE`;
    if (!record) throw new FinancialRecordError(`No financial record for service ${serviceId}`);
    if (record.stripeTransferId) throw new FinancialRecordError('This record has already been paid out');
    if (record.payoutId) throw new FinancialRecordError('This record is part of a payout being sent');
    const next = { ...record, ...changes };
    const diff = Object.fromEntries(fields.map((f) => [f, { from: record[f], to: changes[f] }]));
    return tx.jobFinancialRecord.update({
      where: { serviceId },
      data: {
        ...changes,
        retainedContributionCents:
          next.customerPriceCents - next.scooperEarningCents - next.referralExpenseCents - next.stripeFeeCents,
        adjustments: [...(record.adjustments || []), { at: now.toISOString(), by: by ?? null, reason, changes: diff }],
        updatedAt: now,
      },
    });
  });
}
