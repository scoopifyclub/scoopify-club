import { prisma as defaultDb } from '@/lib/prisma';
import { addDays, localDateString, weekStartOf, weekdayOf, zonedTimeToUtc } from '@/lib/business-time';
import { adjustFinancialRecord } from '@/lib/job-financials';
import { canReceiveTransfers, getStripe, isLiveStripeKey } from '@/lib/stripe-connect';

// Scooper pay comes from JobFinancialRecord, written once per job when it is
// completed and verified (src/lib/job-completion.js). Its payoutStatus:
//   PENDING    owed, waiting for the next weekly payout
//   HELD       owed, but an open PayoutHold (dispute or refund review) covers it
//   PROCESSING attached to a Payout whose Stripe transfer is not confirmed
//   PAID       transferred (stripeTransferId, paidAt)
//   VOID       never payable (refunded or dispute lost before it was paid)
// The job's Earning row mirrors the same status for the older earnings
// screens. PayoutAdjustment rows (clawbacks) are netted into the next payout.
// Payout statuses: PROCESSING, PAID, FAILED. One Payout per scooper per week.

export const PAYOUT_METHOD = 'STRIPE_CONNECT';

/** Transfers run only when PAYOUTS_ENABLED=true; otherwise the cron reports what it would pay. */
export function payoutsEnabled() {
  return process.env.PAYOUTS_ENABLED === 'true';
}

const dollars = (cents) => Math.round(cents) / 100;

/**
 * The weekly payout period for a run at `now`: the Denver Monday–Sunday week
 * before the current one. Unpaid jobs from earlier weeks roll into it.
 */
export function payoutPeriod(now = new Date()) {
  const thisWeek = weekStartOf(localDateString(now));
  const startYmd = addDays(thisWeek, -7);
  return {
    startYmd,
    endYmd: addDays(thisWeek, -1),
    start: zonedTimeToUtc(startYmd),
    end: zonedTimeToUtc(thisWeek),
  };
}

/** The Friday (Denver) on which the cron will next pay, as 'YYYY-MM-DD'. */
export function nextPayoutDate(now = new Date()) {
  const today = localDateString(now);
  return addDays(today, (5 - weekdayOf(today) + 7) % 7);
}

/**
 * Moves unpaid jobs covered by an OPEN PayoutHold to HELD, and back to
 * PENDING once no open hold covers them. Jobs already attached to a payout
 * are left alone.
 */
export async function applyHolds({ db = defaultDb, employeeId, now = new Date() } = {}) {
  const records = await db.jobFinancialRecord.findMany({
    where: { payoutStatus: { in: ['PENDING', 'HELD'] }, payoutId: null, ...(employeeId ? { employeeId } : {}) },
    select: { id: true, serviceId: true, customerId: true, payoutStatus: true, holdReason: true },
  });
  if (!records.length) return { held: 0, released: 0 };

  const holds = await db.payoutHold.findMany({
    where: {
      status: 'OPEN',
      OR: [
        { serviceId: { in: records.map((r) => r.serviceId) } },
        { serviceId: null, customerId: { in: [...new Set(records.map((r) => r.customerId))] } },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  let held = 0;
  let released = 0;
  for (const record of records) {
    const hold = holds.find((h) => (h.serviceId ? h.serviceId === record.serviceId : h.customerId === record.customerId));
    const reason = hold ? `${hold.reason}:${hold.id}` : null;
    if (hold && (record.payoutStatus !== 'HELD' || record.holdReason !== reason)) {
      const { count } = await db.jobFinancialRecord.updateMany({
        where: { id: record.id, payoutStatus: { in: ['PENDING', 'HELD'] }, payoutId: null },
        data: { payoutStatus: 'HELD', holdReason: reason, updatedAt: now },
      });
      if (count) {
        await db.earning.updateMany({ where: { serviceId: record.serviceId, status: { in: ['PENDING', 'HELD'] } }, data: { status: 'HELD', updatedAt: now } });
      }
      held += count;
    } else if (!hold && record.payoutStatus === 'HELD') {
      const { count } = await db.jobFinancialRecord.updateMany({
        where: { id: record.id, payoutStatus: 'HELD', payoutId: null },
        data: { payoutStatus: 'PENDING', holdReason: null, updatedAt: now },
      });
      if (count) {
        await db.earning.updateMany({ where: { serviceId: record.serviceId, status: 'HELD' }, data: { status: 'PENDING', updatedAt: now } });
      }
      released += count;
    }
  }
  return { held, released };
}

/**
 * Takes a job's pay back because the customer's money was returned.
 * Unpaid jobs become VOID, and the financial record's scooper earning is
 * adjusted to 0 with the reason in its adjustment history. Jobs already paid
 * (or mid-transfer) get a negative PayoutAdjustment netted against the
 * scooper's next weekly transfer; Stripe transfers are not reversed, because
 * the scooper's Express balance has usually already gone to their bank.
 * Idempotent.
 */
export async function voidServiceEarning({ db = defaultDb, serviceId, reason, by = 'payouts', now = new Date() }) {
  const record = await db.jobFinancialRecord.findUnique({ where: { serviceId } });
  if (!record) return { serviceId, action: 'NO_RECORD' };
  if (record.payoutStatus === 'VOID') return { serviceId, action: 'ALREADY_VOID' };

  if (['PENDING', 'HELD'].includes(record.payoutStatus) && !record.payoutId && !record.stripeTransferId) {
    const { count } = await db.jobFinancialRecord.updateMany({
      where: { id: record.id, payoutStatus: { in: ['PENDING', 'HELD'] }, payoutId: null },
      data: { payoutStatus: 'VOID', holdReason: reason, updatedAt: now },
    });
    if (count) {
      await db.earning.updateMany({ where: { serviceId }, data: { status: 'VOID', errorMessage: reason, updatedAt: now } });
      if (record.scooperEarningCents !== 0) {
        await adjustFinancialRecord({ serviceId, changes: { scooperEarningCents: 0 }, reason: `Pay voided: ${reason}`, by, now, db });
      }
      return { serviceId, action: 'VOIDED' };
    }
  }

  const { count } = await db.payoutAdjustment.createMany({
    data: [{
      key: `clawback:${serviceId}`,
      employeeId: record.employeeId,
      serviceId,
      amountCents: -Math.abs(record.scooperEarningCents),
      reason,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    }],
    skipDuplicates: true,
  });
  return { serviceId, action: count ? 'CLAWBACK' : 'ALREADY_CLAWED_BACK' };
}

class CarryForward extends Error {
  constructor(cents) {
    super('Net amount is not positive');
    this.cents = cents;
  }
}

/**
 * Sends (or confirms) the Stripe transfer for a PROCESSING or FAILED payout.
 * The same Payout always uses the same idempotency key and transfer_group, and
 * an existing transfer in that group is reused, so a retry after a crash, a
 * timeout or Stripe's 24-hour idempotency window never sends money twice.
 */
async function sendTransfer({ db, stripe, payout, employee, now }) {
  const group = `payout_${payout.id}`;
  try {
    let transfer = (await stripe.transfers.list({ transfer_group: group, limit: 1 })).data?.[0];
    if (!transfer) {
      transfer = await stripe.transfers.create(
        {
          amount: Math.round(payout.amount * 100),
          currency: 'usd',
          destination: employee.stripeConnectAccountId,
          transfer_group: group,
          description: `Scoopify Club payout, week of ${localDateString(payout.weekStart)}`,
          metadata: { payoutId: payout.id, employeeId: employee.id, weekStart: localDateString(payout.weekStart) },
        },
        { idempotencyKey: `scooper-payout-${payout.id}` }
      );
    }

    const records = await db.jobFinancialRecord.findMany({ where: { payoutId: payout.id }, select: { serviceId: true } });
    const serviceIds = records.map((r) => r.serviceId);
    await db.$transaction([
      db.payout.updateMany({
        where: { id: payout.id, status: { in: ['PROCESSING', 'FAILED'] } },
        data: { status: 'PAID', stripeTransferId: transfer.id, transactionId: transfer.id, processedAt: now, failureReason: null },
      }),
      db.jobFinancialRecord.updateMany({
        where: { payoutId: payout.id },
        data: { payoutStatus: 'PAID', stripeTransferId: transfer.id, paidAt: now, updatedAt: now },
      }),
      db.payoutAdjustment.updateMany({ where: { payoutId: payout.id }, data: { status: 'PAID', paidAt: now } }),
      db.earning.updateMany({
        where: { serviceId: { in: serviceIds } },
        data: { status: 'PAID', paidAt: now, paidVia: PAYOUT_METHOD, errorMessage: null, updatedAt: now },
      }),
      db.service.updateMany({ where: { id: { in: serviceIds } }, data: { paymentStatus: 'PAID', updatedAt: now } }),
    ]);
    return { status: 'PAID', transferId: transfer.id };
  } catch (error) {
    const message = (error?.message || String(error)).slice(0, 500);
    await db.payout.updateMany({ where: { id: payout.id, status: 'PROCESSING' }, data: { status: 'FAILED', failureReason: message } });
    return { status: 'FAILED', error: message, code: error?.code };
  }
}

async function openPayout({ db, employeeId, recordIds, adjustmentIds, period, now }) {
  try {
    return await db.$transaction(async (tx) => {
      const payout = await tx.payout.create({
        data: {
          employeeId,
          amount: 0,
          netAmount: 0,
          status: 'PROCESSING',
          paymentMethod: PAYOUT_METHOD,
          weekStart: period.start,
          weekEnd: period.end,
          requestedAt: now,
        },
      });
      await tx.jobFinancialRecord.updateMany({
        where: { id: { in: recordIds }, employeeId, payoutStatus: 'PENDING', payoutId: null, stripeTransferId: null },
        data: { payoutId: payout.id, payoutStatus: 'PROCESSING', updatedAt: now },
      });
      await tx.payoutAdjustment.updateMany({
        where: { id: { in: adjustmentIds }, employeeId, status: 'PENDING', payoutId: null },
        data: { payoutId: payout.id, status: 'PROCESSING' },
      });
      const records = await tx.jobFinancialRecord.findMany({ where: { payoutId: payout.id }, select: { serviceId: true, scooperEarningCents: true } });
      const adjustments = await tx.payoutAdjustment.findMany({ where: { payoutId: payout.id }, select: { amountCents: true } });
      const cents = records.reduce((s, r) => s + r.scooperEarningCents, 0) + adjustments.reduce((s, a) => s + a.amountCents, 0);
      if (cents <= 0 || !records.length) throw new CarryForward(cents);
      await tx.earning.updateMany({
        where: { serviceId: { in: records.map((r) => r.serviceId) } },
        data: { status: 'PROCESSING', updatedAt: now },
      });
      return tx.payout.update({
        where: { id: payout.id },
        data: { amount: dollars(cents), netAmount: dollars(cents), serviceCount: records.length },
      });
    });
  } catch (error) {
    if (error instanceof CarryForward) return { carryForward: true, cents: error.cents };
    if (error?.code === 'P2002') return { conflict: true };
    throw error;
  }
}

/**
 * The weekly payout run. Applies holds, then (when `transfer` is true) pays
 * every scooper with a positive balance one Stripe transfer for the period.
 * Re-running it, concurrently or later, pays nobody twice: the Payout
 * (employeeId, weekStart) unique key admits one payout per scooper per
 * period, records are attached with a conditional update, and the transfer
 * uses a per-payout idempotency key and transfer_group.
 */
export async function runPayouts({ db = defaultDb, stripe, now = new Date(), transfer = payoutsEnabled() } = {}) {
  const period = payoutPeriod(now);
  const holds = await applyHolds({ db, now });

  let blockedReason = null;
  if (transfer && isLiveStripeKey() && process.env.PAYOUTS_ALLOW_LIVE !== 'true') {
    blockedReason = 'STRIPE_SECRET_KEY is a live key; set PAYOUTS_ALLOW_LIVE=true to send real transfers.';
  }
  const live = transfer && !blockedReason;
  const stripeClient = live ? stripe || getStripe() : null;

  const results = [];

  // Finish payouts from earlier runs that crashed or failed before anything new.
  if (live) {
    const unfinished = await db.payout.findMany({
      where: { status: { in: ['PROCESSING', 'FAILED'] }, paymentMethod: PAYOUT_METHOD },
      include: { employee: true },
      orderBy: { requestedAt: 'asc' },
    });
    for (const payout of unfinished) {
      if (!canReceiveTransfers(payout.employee)) {
        results.push({ employeeId: payout.employeeId, payoutId: payout.id, amount: payout.amount, status: 'NEEDS_ONBOARDING' });
        continue;
      }
      const sent = await sendTransfer({ db, stripe: stripeClient, payout, employee: payout.employee, now });
      results.push({ employeeId: payout.employeeId, payoutId: payout.id, amount: payout.amount, retried: true, ...sent });
    }
  }

  const [records, adjustments] = await Promise.all([
    db.jobFinancialRecord.findMany({
      where: { payoutStatus: 'PENDING', payoutId: null, stripeTransferId: null, completedAt: { lt: period.end } },
      select: { id: true, employeeId: true, scooperEarningCents: true },
    }),
    db.payoutAdjustment.findMany({
      where: { status: 'PENDING', payoutId: null },
      select: { id: true, employeeId: true, amountCents: true },
    }),
  ]);
  const byEmployee = new Map();
  const entryFor = (employeeId) => {
    if (!byEmployee.has(employeeId)) byEmployee.set(employeeId, { recordIds: [], adjustmentIds: [], cents: 0 });
    return byEmployee.get(employeeId);
  };
  for (const r of records) {
    const entry = entryFor(r.employeeId);
    entry.recordIds.push(r.id);
    entry.cents += r.scooperEarningCents;
  }
  for (const a of adjustments) {
    const entry = entryFor(a.employeeId);
    entry.adjustmentIds.push(a.id);
    entry.cents += a.amountCents;
  }
  const employees = byEmployee.size
    ? await db.employee.findMany({
        where: { id: { in: [...byEmployee.keys()] } },
        include: { user: { select: { firstName: true, lastName: true } } },
      })
    : [];

  for (const employee of employees) {
    const entry = byEmployee.get(employee.id);
    const base = {
      employeeId: employee.id,
      employeeName: [employee.user?.firstName, employee.user?.lastName].filter(Boolean).join(' ') || null,
      amount: dollars(entry.cents),
      jobCount: entry.recordIds.length,
    };
    if (entry.cents <= 0 || !entry.recordIds.length) {
      results.push({ ...base, status: 'CARRIED_FORWARD' });
      continue;
    }
    if (!canReceiveTransfers(employee)) {
      results.push({ ...base, status: 'NEEDS_ONBOARDING' });
      continue;
    }
    if (!live) {
      results.push({ ...base, status: 'WOULD_PAY' });
      continue;
    }
    const existing = await db.payout.findUnique({
      where: { employeeId_weekStart: { employeeId: employee.id, weekStart: period.start } },
    });
    if (existing) {
      // Already paid (or being paid) for this period; new jobs wait a week.
      results.push({ ...base, payoutId: existing.id, status: existing.status === 'PAID' ? 'ALREADY_PAID' : 'IN_PROGRESS' });
      continue;
    }
    const opened = await openPayout({ db, employeeId: employee.id, recordIds: entry.recordIds, adjustmentIds: entry.adjustmentIds, period, now });
    if (opened.conflict) {
      results.push({ ...base, status: 'IN_PROGRESS' });
      continue;
    }
    if (opened.carryForward) {
      results.push({ ...base, amount: dollars(opened.cents), status: 'CARRIED_FORWARD' });
      continue;
    }
    const sent = await sendTransfer({ db, stripe: stripeClient, payout: opened, employee, now });
    results.push({ ...base, amount: opened.amount, jobCount: opened.serviceCount, payoutId: opened.id, ...sent });
  }

  const sum = (statuses) => dollars(results.filter((r) => statuses.includes(r.status)).reduce((s, r) => s + Math.round(r.amount * 100), 0));
  return {
    mode: live ? 'transfer' : 'report-only',
    blockedReason,
    period: { start: period.startYmd, end: period.endYmd, timeZone: 'America/Denver' },
    holds,
    summary: {
      paid: sum(['PAID']),
      failed: sum(['FAILED']),
      wouldPay: sum(['WOULD_PAY']),
      needsOnboarding: sum(['NEEDS_ONBOARDING']),
      transfers: results.filter((r) => r.status === 'PAID').length,
    },
    results,
  };
}

/** What a scooper sees: Connect status, totals by status, recent jobs, adjustments and payouts. */
export async function employeePayoutSummary(employee, { db = defaultDb, now = new Date() } = {}) {
  await applyHolds({ db, employeeId: employee.id, now });
  const [records, adjustments, payouts, totalsByStatus] = await Promise.all([
    db.jobFinancialRecord.findMany({ where: { employeeId: employee.id }, orderBy: { completedAt: 'desc' }, take: 100 }),
    db.payoutAdjustment.findMany({ where: { employeeId: employee.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
    db.payout.findMany({ where: { employeeId: employee.id }, orderBy: { requestedAt: 'desc' }, take: 20 }),
    db.jobFinancialRecord.groupBy({ by: ['payoutStatus'], where: { employeeId: employee.id }, _sum: { scooperEarningCents: true } }),
  ]);

  const totals = { pending: 0, held: 0, processing: 0, paid: 0, voided: 0, adjustmentsOwed: 0 };
  const key = { PENDING: 'pending', HELD: 'held', PROCESSING: 'processing', PAID: 'paid', VOID: 'voided' };
  for (const row of totalsByStatus) if (key[row.payoutStatus]) totals[key[row.payoutStatus]] = dollars(row._sum.scooperEarningCents || 0);
  totals.adjustmentsOwed = dollars(adjustments.filter((a) => a.status !== 'PAID').reduce((s, a) => s + a.amountCents, 0));

  return {
    account: {
      connected: Boolean(employee.stripeConnectAccountId),
      status: employee.stripeConnectAccountId ? employee.stripeAccountStatus || 'PENDING' : 'NO_ACCOUNT',
      payoutsEnabled: Boolean(employee.stripePayoutsEnabled),
      detailsSubmitted: Boolean(employee.stripeDetailsSubmitted),
      readyForTransfers: canReceiveTransfers(employee),
    },
    automaticPayouts: payoutsEnabled(),
    nextPayoutDate: nextPayoutDate(now),
    totals,
    earnings: [
      ...records.map((r) => ({
        id: r.id,
        kind: 'JOB',
        serviceId: r.serviceId,
        serviceDate: r.completedAt,
        amount: dollars(r.scooperEarningCents),
        status: r.payoutStatus,
        holdReason: r.holdReason ? r.holdReason.split(':')[0] : null,
        paidAt: r.paidAt,
        payoutId: r.payoutId,
      })),
      ...adjustments.map((a) => ({
        id: a.id,
        kind: 'ADJUSTMENT',
        serviceId: a.serviceId,
        serviceDate: a.createdAt,
        amount: dollars(a.amountCents),
        status: a.status,
        holdReason: null,
        paidAt: a.paidAt,
        payoutId: a.payoutId,
      })),
    ].sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate)),
    payouts: payouts.map((p) => ({
      id: p.id,
      periodStart: p.weekStart,
      periodEnd: p.weekEnd ? new Date(p.weekEnd.getTime() - 1) : null,
      amount: p.amount,
      status: p.status,
      jobCount: p.serviceCount,
      paidAt: p.processedAt,
      failureReason: p.status === 'FAILED' ? 'The transfer did not go through; it is retried automatically on the next payout run.' : null,
      stripeTransferId: p.stripeTransferId,
    })),
  };
}
