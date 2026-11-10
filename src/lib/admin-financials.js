import { prisma as defaultDb } from '@/lib/prisma';
import { addDays, localDateString, zonedTimeToUtc } from '@/lib/business-time';

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const PAYOUT_STATUSES = new Set(['PENDING', 'HELD', 'PROCESSING', 'PAID', 'VOID']);
const PRICING_BASES = new Set(['ONE_TIME', 'SUBSCRIPTION_WEEKLY']);

const dollars = (cents) => Math.round(Number(cents || 0)) / 100;

function personName(user) {
  if (!user) return null;
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.email || null;
}

/**
 * Parse Denver calendar dates from query params. Defaults to the last 28 days
 * ending today when neither bound is set.
 */
export function parseFinancialDateRange({ from, to, now = new Date() } = {}) {
  const toYmd = to || localDateString(now);
  const fromYmd = from || addDays(toYmd, -27);
  if (!YMD.test(fromYmd) || !YMD.test(toYmd)) {
    const error = new Error('from and to must be YYYY-MM-DD');
    error.status = 400;
    throw error;
  }
  if (fromYmd > toYmd) {
    const error = new Error('from must be on or before to');
    error.status = 400;
    throw error;
  }
  return {
    from: fromYmd,
    to: toYmd,
    start: zonedTimeToUtc(fromYmd),
    end: zonedTimeToUtc(addDays(toYmd, 1)),
  };
}

function serializeRecord(row) {
  const customer = row.service?.customer;
  const employee = row.service?.employee;
  return {
    id: row.id,
    serviceId: row.serviceId,
    customerId: row.customerId,
    employeeId: row.employeeId,
    subscriptionId: row.subscriptionId,
    servicePlanId: row.servicePlanId,
    pricingBasis: row.pricingBasis,
    planPriceCents: row.planPriceCents,
    customerPriceCents: row.customerPriceCents,
    scooperEarningCents: row.scooperEarningCents,
    referralExpenseCents: row.referralExpenseCents,
    stripeFeeCents: row.stripeFeeCents,
    stripeFeeEstimated: row.stripeFeeEstimated,
    retainedContributionCents: row.retainedContributionCents,
    // Dollars for the ops table (revenue / scooper / fees / Scoopify keep).
    revenue: dollars(row.customerPriceCents),
    scooperShare: dollars(row.scooperEarningCents),
    stripeFees: dollars(row.stripeFeeCents),
    scoopifyKeep: dollars(row.retainedContributionCents),
    referralExpense: dollars(row.referralExpenseCents),
    adjustments: row.adjustments || [],
    checkedInAt: row.checkedInAt,
    completedAt: row.completedAt,
    serviceDurationSeconds: row.serviceDurationSeconds,
    payoutStatus: row.payoutStatus,
    stripeTransferId: row.stripeTransferId,
    paidAt: row.paidAt,
    payoutId: row.payoutId,
    holdReason: row.holdReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    customerName: personName(customer?.user),
    customerEmail: customer?.user?.email || null,
    scooperName: personName(employee?.user),
    scooperEmail: employee?.user?.email || null,
    scooperPayoutsEnabled: employee?.stripePayoutsEnabled ?? null,
    planName: row.service?.servicePlan?.name || null,
    planType: row.service?.servicePlan?.type || null,
    serviceStatus: row.service?.status || null,
    serviceDate: row.service?.serviceDate || null,
    payout: row.payout
      ? {
          id: row.payout.id,
          status: row.payout.status,
          weekStart: row.payout.weekStart,
          stripeTransferId: row.payout.stripeTransferId,
          amount: row.payout.amount,
        }
      : null,
  };
}

/**
 * List JobFinancialRecord rows for the admin finops dashboard.
 * Filters: from/to (completedAt, Denver), payoutStatus, employeeId, customerId,
 * pricingBasis, q (service id / email / name substring).
 */
export async function listJobFinancialRecords({
  db = defaultDb,
  from,
  to,
  payoutStatus,
  employeeId,
  customerId,
  pricingBasis,
  q,
  limit = 100,
  offset = 0,
  now = new Date(),
} = {}) {
  const range = parseFinancialDateRange({ from, to, now });
  const take = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const skip = Math.max(Number(offset) || 0, 0);

  const where = {
    completedAt: { gte: range.start, lt: range.end },
  };

  if (payoutStatus && payoutStatus !== 'ALL') {
    const status = String(payoutStatus).toUpperCase();
    if (!PAYOUT_STATUSES.has(status)) {
      const error = new Error(`payoutStatus must be one of ${[...PAYOUT_STATUSES].join(', ')} or ALL`);
      error.status = 400;
      throw error;
    }
    where.payoutStatus = status;
  }

  if (employeeId) where.employeeId = employeeId;
  if (customerId) where.customerId = customerId;

  if (pricingBasis && pricingBasis !== 'ALL') {
    const basis = String(pricingBasis).toUpperCase();
    if (!PRICING_BASES.has(basis)) {
      const error = new Error(`pricingBasis must be one of ${[...PRICING_BASES].join(', ')} or ALL`);
      error.status = 400;
      throw error;
    }
    where.pricingBasis = basis;
  }

  const query = String(q || '').trim();
  if (query) {
    const like = { contains: query, mode: 'insensitive' };
    where.OR = [
      { serviceId: like },
      { id: like },
      { stripeTransferId: like },
      { holdReason: like },
      {
        service: {
          OR: [
            { customer: { user: { OR: [{ email: like }, { firstName: like }, { lastName: like }] } } },
            { employee: { user: { OR: [{ email: like }, { firstName: like }, { lastName: like }] } } },
          ],
        },
      },
    ];
  }

  const include = {
    service: {
      select: {
        id: true,
        status: true,
        serviceDate: true,
        customer: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        employee: {
          select: {
            id: true,
            stripePayoutsEnabled: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        servicePlan: { select: { id: true, name: true, type: true } },
      },
    },
    payout: {
      select: {
        id: true,
        status: true,
        weekStart: true,
        stripeTransferId: true,
        amount: true,
      },
    },
  };

  const [total, rows, aggregates] = await Promise.all([
    db.jobFinancialRecord.count({ where }),
    db.jobFinancialRecord.findMany({
      where,
      include,
      orderBy: { completedAt: 'desc' },
      take,
      skip,
    }),
    db.jobFinancialRecord.aggregate({
      where,
      _count: true,
      _sum: {
        customerPriceCents: true,
        scooperEarningCents: true,
        stripeFeeCents: true,
        retainedContributionCents: true,
        referralExpenseCents: true,
      },
    }),
  ]);

  return {
    range: { from: range.from, to: range.to, timeZone: 'America/Denver' },
    filters: {
      payoutStatus: payoutStatus || 'ALL',
      employeeId: employeeId || null,
      customerId: customerId || null,
      pricingBasis: pricingBasis || 'ALL',
      q: query || null,
    },
    pagination: { total, limit: take, offset: skip },
    totals: {
      jobs: aggregates._count,
      revenue: dollars(aggregates._sum.customerPriceCents),
      scooperShare: dollars(aggregates._sum.scooperEarningCents),
      stripeFees: dollars(aggregates._sum.stripeFeeCents),
      scoopifyKeep: dollars(aggregates._sum.retainedContributionCents),
      referralExpense: dollars(aggregates._sum.referralExpenseCents),
    },
    records: rows.map(serializeRecord),
  };
}

/**
 * Compact ops snapshot for the dashboard header: owed balances, open holds,
 * recent payouts, and payout-status breakdown. Date range applies to recent
 * completed jobs and recent payouts; owed/open holds are current (not ranged).
 */
export async function financialOpsSnapshot({ db = defaultDb, from, to, now = new Date() } = {}) {
  const range = parseFinancialDateRange({ from, to, now });
  const inRange = { gte: range.start, lt: range.end };

  const [jobAgg, statusGroups, owedGroups, openHolds, recentPayouts, pendingAdjustments] = await Promise.all([
    db.jobFinancialRecord.aggregate({
      where: { completedAt: inRange },
      _count: true,
      _sum: {
        customerPriceCents: true,
        scooperEarningCents: true,
        stripeFeeCents: true,
        retainedContributionCents: true,
        referralExpenseCents: true,
      },
    }),
    db.jobFinancialRecord.groupBy({
      by: ['payoutStatus'],
      where: { completedAt: inRange },
      _count: true,
      _sum: { scooperEarningCents: true },
    }),
    db.jobFinancialRecord.groupBy({
      by: ['payoutStatus'],
      where: { payoutStatus: { in: ['PENDING', 'HELD', 'PROCESSING'] } },
      _count: true,
      _sum: { scooperEarningCents: true },
    }),
    db.payoutHold.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      take: 25,
      select: {
        id: true,
        reason: true,
        status: true,
        customerId: true,
        serviceId: true,
        amount: true,
        note: true,
        createdAt: true,
        stripeObjectId: true,
      },
    }),
    db.payout.findMany({
      where: { requestedAt: inRange },
      orderBy: { requestedAt: 'desc' },
      take: 25,
      include: {
        employee: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    }),
    db.payoutAdjustment.aggregate({
      where: { status: { not: 'PAID' } },
      _sum: { amountCents: true },
      _count: true,
    }),
  ]);

  const byStatus = Object.fromEntries(
    statusGroups.map((row) => [
      row.payoutStatus,
      { count: row._count, scooperShare: dollars(row._sum.scooperEarningCents) },
    ]),
  );

  const owed = Object.fromEntries(
    ['PENDING', 'HELD', 'PROCESSING'].map((status) => {
      const row = owedGroups.find((r) => r.payoutStatus === status);
      return [
        status.toLowerCase(),
        { count: row?._count || 0, amount: dollars(row?._sum.scooperEarningCents) },
      ];
    }),
  );

  return {
    range: { from: range.from, to: range.to, timeZone: 'America/Denver' },
    jobEconomics: {
      jobsCompleted: jobAgg._count,
      revenue: dollars(jobAgg._sum.customerPriceCents),
      scooperShare: dollars(jobAgg._sum.scooperEarningCents),
      stripeFees: dollars(jobAgg._sum.stripeFeeCents),
      scoopifyKeep: dollars(jobAgg._sum.retainedContributionCents),
      referralExpense: dollars(jobAgg._sum.referralExpenseCents),
      byPayoutStatus: byStatus,
    },
    owedToScoopers: {
      ...owed,
      adjustments: {
        count: pendingAdjustments._count,
        amount: dollars(pendingAdjustments._sum.amountCents),
      },
      openHolds: openHolds.length,
    },
    openHolds,
    recentPayouts: recentPayouts.map((p) => ({
      id: p.id,
      employeeId: p.employeeId,
      scooperName: personName(p.employee?.user),
      scooperEmail: p.employee?.user?.email || null,
      amount: p.amount,
      netAmount: p.netAmount,
      status: p.status,
      serviceCount: p.serviceCount,
      weekStart: p.weekStart,
      weekEnd: p.weekEnd,
      requestedAt: p.requestedAt,
      processedAt: p.processedAt,
      stripeTransferId: p.stripeTransferId,
      failureReason: p.failureReason,
      paymentMethod: p.paymentMethod,
    })),
  };
}
