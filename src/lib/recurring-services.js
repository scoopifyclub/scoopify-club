import crypto from 'crypto';
import { prisma as defaultDb } from '@/lib/prisma';
import { calculateMonthlyServicePayment } from '@/lib/payment-calculator';
import {
  addDays,
  dateColumnToString,
  dateColumnValue,
  localDateString,
  localTimeOfDay,
  parseWeekday,
  startOfLocalDay,
  weekStartOf,
  weekdayOf,
  zonedTimeToUtc,
} from '@/lib/business-time';

// Recurring visits are generated from ACTIVE subscriptions, one per week on
// the customer's preferred day (Customer.serviceDay), at SERVICE_START_HOUR
// America/Denver. Each row carries (subscriptionId, serviceDate); the unique
// index on that pair makes re-runs and concurrent runs no-ops.

export const SERVICE_START_HOUR = 7;
export const DEFAULT_HORIZON_DAYS = 7;
export const MAX_HORIZON_DAYS = 35;

export function perVisitEarnings(servicePlan) {
  const price = Number(servicePlan?.price);
  if (!Number.isFinite(price) || price <= 0) return null;
  return calculateMonthlyServicePayment(price).scooperPaymentPerService;
}

/**
 * Calendar dates in [from, from + days) on which a subscription is due a
 * visit: the customer's preferred weekday, within the subscription's start
 * and end dates.
 */
export function dueVisitDates({ subscription, serviceDay, from, days }) {
  const weekday = parseWeekday(serviceDay);
  if (weekday === null) return [];
  const first = subscription.startDate ? localDateString(subscription.startDate) : null;
  const last = subscription.endDate ? localDateString(subscription.endDate) : null;
  const dates = [];
  for (let i = 0; i < days; i++) {
    const ymd = addDays(from, i);
    if (weekdayOf(ymd) !== weekday) continue;
    if (first && ymd < first) continue;
    if (last && ymd > last) continue;
    dates.push(ymd);
  }
  return dates;
}

/**
 * Creates the visits due in the next `days` Denver calendar days, starting
 * today (tomorrow once today's SERVICE_START_HOUR has passed) or `from` if
 * later. Safe to run any number of times: visits that
 * already exist for a subscription and date are skipped by the database,
 * and a subscription that already has a visit in a given week (e.g. on its
 * old service day) does not get a second one that week.
 */
export async function createRecurringServices({ now = new Date(), from, days = DEFAULT_HORIZON_DAYS, db = defaultDb } = {}) {
  const today = localDateString(now);
  const earliest = localTimeOfDay(now).hour < SERVICE_START_HOUR ? today : addDays(today, 1);
  const start = from && from > earliest ? from : earliest;
  const horizon = Math.min(Math.max(Math.trunc(Number(days)) || DEFAULT_HORIZON_DAYS, 1), MAX_HORIZON_DAYS);
  const end = addDays(start, horizon - 1);

  const subscriptions = await db.subscription.findMany({
    where: {
      status: 'ACTIVE',
      OR: [{ endDate: null }, { endDate: { gte: startOfLocalDay(now) } }],
      servicePlan: { type: { not: 'ONE_TIME' } },
    },
    select: {
      id: true,
      customerId: true,
      planId: true,
      startDate: true,
      endDate: true,
      servicePlan: { select: { price: true } },
      customer: { select: { serviceDay: true } },
    },
  });

  const missingServiceDay = [];
  const candidates = [];
  for (const subscription of subscriptions) {
    const serviceDay = subscription.customer?.serviceDay;
    if (parseWeekday(serviceDay) === null) {
      missingServiceDay.push({ subscriptionId: subscription.id, customerId: subscription.customerId, serviceDay: serviceDay ?? null });
      continue;
    }
    for (const ymd of dueVisitDates({ subscription, serviceDay, from: start, days: horizon })) {
      candidates.push({ subscription, ymd });
    }
  }

  const weeksTaken = new Set();
  if (candidates.length > 0) {
    const existing = await db.service.findMany({
      where: {
        subscriptionId: { in: [...new Set(candidates.map((c) => c.subscription.id))] },
        serviceDate: { gte: dateColumnValue(weekStartOf(start)), lte: dateColumnValue(addDays(weekStartOf(end), 6)) },
      },
      select: { subscriptionId: true, serviceDate: true },
    });
    for (const row of existing) {
      weeksTaken.add(`${row.subscriptionId}:${weekStartOf(dateColumnToString(row.serviceDate))}`);
    }
  }

  const rows = [];
  let alreadyScheduled = 0;
  for (const { subscription, ymd } of candidates) {
    const weekKey = `${subscription.id}:${weekStartOf(ymd)}`;
    if (weeksTaken.has(weekKey)) {
      alreadyScheduled++;
      continue;
    }
    weeksTaken.add(weekKey);
    rows.push({
      id: crypto.randomUUID(),
      customerId: subscription.customerId,
      subscriptionId: subscription.id,
      servicePlanId: subscription.planId,
      serviceDate: dateColumnValue(ymd),
      scheduledDate: zonedTimeToUtc(ymd, SERVICE_START_HOUR),
      status: 'SCHEDULED',
      workflowStatus: 'AVAILABLE',
      potentialEarnings: perVisitEarnings(subscription.servicePlan),
      updatedAt: now,
    });
  }

  const { count: created } = rows.length
    ? await db.service.createMany({ data: rows, skipDuplicates: true })
    : { count: 0 };

  if (missingServiceDay.length > 0) {
    try {
      await db.systemLog.create({
        data: {
          type: 'RECURRING_SERVICE_NO_DAY',
          message: `${missingServiceDay.length} active subscription(s) have no valid preferred service day; no visits were created for them`,
          data: { subscriptions: missingServiceDay, window: { from: start, to: end } },
        },
      });
    } catch (error) {
      console.error('Failed to log subscriptions without a service day:', error);
    }
  }

  return {
    window: { from: start, to: end, timeZone: 'America/Denver' },
    activeSubscriptions: subscriptions.length,
    created,
    alreadyScheduled: alreadyScheduled + (rows.length - created),
    missingServiceDay,
  };
}
