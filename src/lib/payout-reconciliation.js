import { prisma as defaultDb } from '@/lib/prisma';
import { addDays, localDateString, zonedTimeToUtc } from '@/lib/business-time';

const toCents = (amount) => Math.round(Number(amount || 0) * 100);
const dollars = (cents) => Math.round(cents) / 100;
const MAX_BALANCE_TRANSACTIONS = 5000;

/**
 * Stripe's balance transactions are the money that actually moved: customer
 * charges and their fees, refunds, disputes, transfers to scoopers and
 * referral partners, and Connect fees (Express charges per active account and
 * per payout). They are the source of truth for revenue and fees; Payment
 * rows often lack stripeFee.
 */
async function stripeTotals(stripe, { start, end }, { scooperTransferIds, referralTransferIds }) {
  const totals = { grossRevenue: 0, stripeFees: 0, connectFees: 0, refunds: 0, disputes: 0, scooperTransfers: 0, referralTransfers: 0, otherTransfers: 0, transferReversals: 0 };
  const transferIds = new Set();
  let count = 0;
  let truncated = false;
  const list = stripe.balanceTransactions.list({
    created: { gte: Math.floor(start.getTime() / 1000), lt: Math.floor(end.getTime() / 1000) },
    limit: 100,
  });
  for await (const txn of list) {
    if (++count > MAX_BALANCE_TRANSACTIONS) {
      truncated = true;
      break;
    }
    totals.stripeFees += txn.fee || 0;
    switch (txn.type) {
      case 'charge':
      case 'payment':
        totals.grossRevenue += txn.amount;
        break;
      case 'refund':
      case 'payment_refund':
        totals.refunds += -txn.amount;
        break;
      case 'adjustment':
        if ((txn.reporting_category || '').startsWith('dispute')) totals.disputes += -txn.amount;
        break;
      case 'transfer': {
        const id = typeof txn.source === 'string' ? txn.source : txn.source?.id;
        transferIds.add(id);
        if (scooperTransferIds.has(id)) totals.scooperTransfers += -txn.amount;
        else if (referralTransferIds.has(id)) totals.referralTransfers += -txn.amount;
        else totals.otherTransfers += -txn.amount;
        break;
      }
      case 'transfer_cancel':
      case 'transfer_refund':
      case 'transfer_failure':
        totals.transferReversals += txn.amount;
        break;
      case 'stripe_fee':
        totals.connectFees += -txn.amount;
        break;
      default:
        break;
    }
  }
  const margin = totals.grossRevenue - totals.refunds - totals.disputes - totals.stripeFees - totals.connectFees -
    totals.scooperTransfers - totals.referralTransfers - totals.otherTransfers + totals.transferReversals;
  return {
    ...Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, dollars(v)])),
    scoopifyMargin: dollars(margin),
    balanceTransactions: Math.min(count, MAX_BALANCE_TRANSACTIONS),
    truncated,
    transferIds,
  };
}

/**
 * Revenue, Stripe fees, scooper payouts and Scoopify margin for the Denver
 * dates `from`..`to` (inclusive), plus what is still owed to scoopers and any
 * mismatch between the payout ledger and Stripe.
 */
export async function payoutReconciliation({ db = defaultDb, stripe = null, from, to, now = new Date() } = {}) {
  const toYmd = to || localDateString(now);
  const fromYmd = from || addDays(toYmd, -27);
  const start = zonedTimeToUtc(fromYmd);
  const end = zonedTimeToUtc(addDays(toYmd, 1));
  const inRange = { gte: start, lt: end };

  const [payments, refunds, payouts, jobs, voided, owedRecords, owedAdjustments, clawbacks, referralPayouts, openHolds] = await Promise.all([
    db.payment.findMany({
      where: { customerId: { not: null }, status: 'PAID', OR: [{ paidAt: inRange }, { paidAt: null, createdAt: inRange }] },
      select: { amount: true, stripeFee: true },
    }),
    db.payment.findMany({ where: { refundedAt: inRange }, select: { refundedAmount: true } }),
    db.payout.findMany({
      where: { status: 'PAID', processedAt: inRange },
      select: { id: true, employeeId: true, amount: true, weekStart: true, processedAt: true, stripeTransferId: true, serviceCount: true },
      orderBy: { processedAt: 'asc' },
    }),
    db.jobFinancialRecord.aggregate({
      where: { completedAt: inRange },
      _count: true,
      _sum: { customerPriceCents: true, scooperEarningCents: true, referralExpenseCents: true, stripeFeeCents: true, retainedContributionCents: true },
    }),
    db.jobFinancialRecord.count({ where: { completedAt: inRange, payoutStatus: 'VOID' } }),
    db.jobFinancialRecord.groupBy({ by: ['payoutStatus'], where: { payoutStatus: { in: ['PENDING', 'HELD', 'PROCESSING'] } }, _sum: { scooperEarningCents: true } }),
    db.payoutAdjustment.aggregate({ where: { status: { not: 'PAID' } }, _sum: { amountCents: true } }),
    db.payoutAdjustment.aggregate({ where: { status: 'PAID', paidAt: inRange }, _sum: { amountCents: true } }),
    db.referralPayout.findMany({ where: { status: { in: ['PAID', 'COMPLETED'] }, processedAt: inRange }, select: { amount: true, stripeTransferId: true } }),
    db.payoutHold.count({ where: { status: 'OPEN' } }),
  ]);

  const sumCents = (rows, field) => rows.reduce((s, r) => s + toCents(r[field]), 0);
  const revenue = sumCents(payments, 'amount');
  const fees = sumCents(payments, 'stripeFee');
  const refunded = sumCents(refunds, 'refundedAmount');
  const scooperPaid = sumCents(payouts, 'amount');
  const referralPaid = sumCents(referralPayouts, 'amount');
  const jobSum = (field) => dollars(jobs._sum[field] || 0);

  // Per-job economics from JobFinancialRecord (jobs completed in the range).
  const jobEconomics = {
    jobsCompleted: jobs._count,
    jobsVoided: voided,
    customerPriceAllocated: jobSum('customerPriceCents'),
    scooperEarnings: jobSum('scooperEarningCents'),
    referralExpense: jobSum('referralExpenseCents'),
    stripeFeesEstimated: jobSum('stripeFeeCents'),
    retainedContribution: jobSum('retainedContributionCents'),
  };

  // Cash that moved in the range, from Payment and Payout rows.
  const ledger = {
    revenue: dollars(revenue),
    paymentsCounted: payments.length,
    paymentsMissingStripeFee: payments.filter((p) => p.stripeFee == null).length,
    stripeFeesRecorded: dollars(fees),
    refunds: dollars(refunded),
    scooperPayouts: dollars(scooperPaid),
    clawbacksRecovered: dollars(-(clawbacks._sum.amountCents || 0)),
    referralPayouts: dollars(referralPaid),
    scoopifyMargin: dollars(revenue - refunded - fees - scooperPaid - referralPaid),
  };

  const owed = Object.fromEntries(['PENDING', 'HELD', 'PROCESSING'].map((s) => {
    const row = owedRecords.find((r) => r.payoutStatus === s);
    return [s.toLowerCase(), dollars(row?._sum.scooperEarningCents || 0)];
  }));
  owed.adjustments = dollars(owedAdjustments._sum.amountCents || 0);

  const issues = [];
  for (const p of payouts) {
    if (!p.stripeTransferId) issues.push({ type: 'PAID_PAYOUT_WITHOUT_TRANSFER', payoutId: p.id });
  }

  let stripeSection = null;
  if (stripe) {
    const scooperTransferIds = new Set(payouts.map((p) => p.stripeTransferId).filter(Boolean));
    const referralTransferIds = new Set(referralPayouts.map((r) => r.stripeTransferId).filter(Boolean));
    const { transferIds, ...totals } = await stripeTotals(stripe, { start, end }, { scooperTransferIds, referralTransferIds });
    stripeSection = totals;
    for (const p of payouts) {
      if (p.stripeTransferId && !totals.truncated && !transferIds.has(p.stripeTransferId)) {
        issues.push({ type: 'TRANSFER_NOT_IN_STRIPE_RANGE', payoutId: p.id, stripeTransferId: p.stripeTransferId });
      }
    }
    if (totals.scooperTransfers !== ledger.scooperPayouts) {
      issues.push({ type: 'SCOOPER_PAYOUT_MISMATCH', ledger: ledger.scooperPayouts, stripe: totals.scooperTransfers });
    }
  }

  return {
    range: { from: fromYmd, to: toYmd, timeZone: 'America/Denver' },
    stripe: stripeSection,
    jobEconomics,
    ledger,
    owedToScoopers: { ...owed, openHolds },
    payouts,
    issues,
  };
}
