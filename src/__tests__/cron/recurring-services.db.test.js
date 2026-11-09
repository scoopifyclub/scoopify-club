/**
 * @jest-environment node
 *
 * Recurring visit creation, rollover and the payout report against a real
 * Postgres. Needs TEST_DATABASE_URL pointing at a local, disposable database
 * whose name contains "test" (tables are truncated). Run with: npm run test:cron
 */
import { execSync } from 'child_process';
import { NextRequest } from 'next/server';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

function assertDisposableDatabase(url) {
  const parsed = new URL(url);
  if (!['localhost', '127.0.0.1', '::1'].includes(parsed.hostname) || !/test/i.test(parsed.pathname)) {
    throw new Error(`Refusing to run destructive tests against ${parsed.hostname}${parsed.pathname}`);
  }
}

if (TEST_DATABASE_URL) {
  assertDisposableDatabase(TEST_DATABASE_URL);
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  delete process.env.DIRECT_URL;
}
process.env.JWT_SECRET = 'recurring-services-test-secret';
process.env.ADMIN_EMAILS = 'owner@scoopify.club';
process.env.CRON_SECRET = 'cron-secret-for-recurring-services-tests';

jest.unmock('@/lib/prisma');

const describeDb = TEST_DATABASE_URL ? describe : describe.skip;
if (!TEST_DATABASE_URL) {
  console.warn('Skipping recurring-services DB tests: set TEST_DATABASE_URL (see npm run test:cron).');
}

const BASE = 'http://localhost:3000';
// Monday 2026-11-09, 04:00 MST: before the 07:00 start, so today is in the window.
const MONDAY_EARLY = new Date('2026-11-09T11:00:00Z');

describeDb('recurring visits (real Postgres)', () => {
  let prisma;
  let recurring;
  let claims;
  let routes;
  let seq = 0;
  let plan;

  beforeAll(async () => {
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: 'pipe',
    });
    ({ prisma } = require('@/lib/prisma'));
    recurring = require('@/lib/recurring-services');
    claims = require('@/lib/job-claims');
    routes = {
      weekly: require('@/app/api/cron/create-weekly-services/route'),
      payouts: require('@/app/api/cron/process-employee-payouts/route'),
    };
  }, 120000);

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "Service", "Subscription", "ServicePlan", "Address", "Customer", "Employee", "User", "SystemLog", "Notification", "Payout", "Earning" CASCADE'
    );
    plan = await prisma.servicePlan.create({
      data: { id: id('plan'), name: 'Weekly 1 dog', price: 55, duration: 30, type: 'MONTHLY', updatedAt: new Date() },
    });
  });

  const id = (prefix) => `${prefix}-${++seq}-${Math.random().toString(36).slice(2, 8)}`;

  async function createSubscriber({
    serviceDay = 'monday',
    status = 'ACTIVE',
    startDate = new Date('2026-10-01T00:00:00Z'),
    endDate = null,
    servicePlan = plan,
  } = {}) {
    const user = await prisma.user.create({
      data: {
        id: id('user'),
        email: `${id('customer')}@example.com`,
        password: 'not-a-real-hash',
        role: 'CUSTOMER',
        firstName: 'Casey',
        lastName: 'Customer',
        updatedAt: new Date(),
      },
    });
    const customer = await prisma.customer.create({
      data: { id: id('cust'), userId: user.id, serviceDay, updatedAt: new Date() },
    });
    const subscription = await prisma.subscription.create({
      data: {
        id: id('sub'),
        customerId: customer.id,
        planId: servicePlan.id,
        status,
        startDate,
        endDate,
        updatedAt: new Date(),
      },
    });
    return { user, customer, subscription };
  }

  const servicesFor = (subscriptionId) =>
    prisma.service.findMany({ where: { subscriptionId }, orderBy: { scheduledDate: 'asc' } });

  const cronRequest = (path, method = 'GET') =>
    new NextRequest(`${BASE}${path}`, { method, headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });

  it('creates one visit per active subscription on the preferred day at 07:00 America/Denver', async () => {
    const { subscription } = await createSubscriber({ serviceDay: 'Thursday' });
    const result = await recurring.createRecurringServices({ now: MONDAY_EARLY });

    expect(result.window).toEqual({ from: '2026-11-09', to: '2026-11-15', timeZone: 'America/Denver' });
    expect(result.created).toBe(1);
    const [visit] = await servicesFor(subscription.id);
    expect(visit.serviceDate.toISOString().slice(0, 10)).toBe('2026-11-12');
    expect(visit.scheduledDate.toISOString()).toBe('2026-11-12T14:00:00.000Z');
    expect(visit.status).toBe('SCHEDULED');
    expect(visit.employeeId).toBeNull();
    expect(visit.servicePlanId).toBe(plan.id);
    // $55 x 12 / 52 x 75%
    expect(visit.potentialEarnings).toBe(9.52);
  });

  it('running weekly creation twice yields no duplicates', async () => {
    const subs = await Promise.all([
      createSubscriber({ serviceDay: 'monday' }),
      createSubscriber({ serviceDay: 'Wednesday' }),
      createSubscriber({ serviceDay: 'sunday' }),
    ]);
    const first = await recurring.createRecurringServices({ now: MONDAY_EARLY });
    const countAfterFirst = await prisma.service.count();
    const second = await recurring.createRecurringServices({ now: MONDAY_EARLY });

    expect(first.created).toBe(3);
    expect(second.created).toBe(0);
    expect(second.alreadyScheduled).toBe(3);
    expect(await prisma.service.count()).toBe(countAfterFirst);
    for (const { subscription } of subs) {
      expect(await servicesFor(subscription.id)).toHaveLength(1);
    }
  });

  it('running the cron route twice yields no duplicates', async () => {
    await createSubscriber({ serviceDay: 'friday' });
    await createSubscriber({ serviceDay: 'saturday' });

    const first = await routes.weekly.GET(cronRequest('/api/cron/create-weekly-services'));
    const firstBody = await first.json();
    const second = await routes.weekly.POST(cronRequest('/api/cron/create-weekly-services', 'POST'));
    const secondBody = await second.json();

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(firstBody.servicesCreated).toBe(2);
    expect(secondBody.servicesCreated).toBe(0);
    expect(await prisma.service.count()).toBe(2);
  });

  it('concurrent runs create each visit once', async () => {
    const subs = await Promise.all(Array.from({ length: 5 }, () => createSubscriber({ serviceDay: 'tuesday' })));
    const results = await Promise.all(
      Array.from({ length: 6 }, () => recurring.createRecurringServices({ now: MONDAY_EARLY }))
    );

    expect(results.reduce((sum, r) => sum + r.created, 0)).toBe(5);
    expect(await prisma.service.count()).toBe(5);
    for (const { subscription } of subs) {
      expect(await servicesFor(subscription.id)).toHaveLength(1);
    }
  });

  it('the database rejects a second visit for the same subscription and date', async () => {
    const { subscription } = await createSubscriber();
    await recurring.createRecurringServices({ now: MONDAY_EARLY });
    const [visit] = await servicesFor(subscription.id);

    await expect(
      prisma.service.create({
        data: {
          id: id('dup'),
          customerId: visit.customerId,
          subscriptionId: subscription.id,
          servicePlanId: plan.id,
          serviceDate: visit.serviceDate,
          scheduledDate: visit.scheduledDate,
          updatedAt: new Date(),
        },
      })
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('uses the Denver date near midnight UTC and skips today after the start hour', async () => {
    const { subscription: monday } = await createSubscriber({ serviceDay: 'monday' });
    const { subscription: tuesday } = await createSubscriber({ serviceDay: 'tuesday' });
    // 05:30 UTC Tuesday = 22:30 MST Monday Nov 9: today (Monday) has started, Tuesday is tomorrow.
    const result = await recurring.createRecurringServices({ now: new Date('2026-11-10T05:30:00Z') });

    expect(result.window.from).toBe('2026-11-10');
    expect(result.window.to).toBe('2026-11-16');
    const [mondayVisit] = await servicesFor(monday.id);
    const [tuesdayVisit] = await servicesFor(tuesday.id);
    expect(mondayVisit.serviceDate.toISOString().slice(0, 10)).toBe('2026-11-16');
    expect(tuesdayVisit.serviceDate.toISOString().slice(0, 10)).toBe('2026-11-10');
    expect(tuesdayVisit.scheduledDate.toISOString()).toBe('2026-11-10T14:00:00.000Z');
  });

  it('schedules across the DST change at 07:00 local time', async () => {
    const { subscription } = await createSubscriber({ serviceDay: 'sunday' });
    // Sunday Oct 25 2026 04:00 MDT, horizon of two weeks covers Oct 25 (MDT) and Nov 1 (MST).
    await recurring.createRecurringServices({ now: new Date('2026-10-25T10:00:00Z'), days: 14 });
    const visits = await servicesFor(subscription.id);
    expect(visits.map((v) => v.scheduledDate.toISOString())).toEqual([
      '2026-10-25T13:00:00.000Z',
      '2026-11-01T14:00:00.000Z',
    ]);
  });

  it('only schedules ACTIVE, recurring subscriptions within their dates', async () => {
    const oneTimePlan = await prisma.servicePlan.create({
      data: { id: id('plan'), name: 'One time', price: 75, duration: 30, type: 'ONE_TIME', updatedAt: new Date() },
    });
    const active = await createSubscriber();
    const cancelled = await createSubscriber({ status: 'CANCELLED' });
    const suspended = await createSubscriber({ status: 'SUSPENDED' });
    const ended = await createSubscriber({ endDate: new Date('2026-11-01T00:00:00Z') });
    const endsSoon = await createSubscriber({ serviceDay: 'friday', endDate: new Date('2026-11-12T23:00:00Z') });
    const notStarted = await createSubscriber({ startDate: new Date('2026-11-20T00:00:00Z') });
    const oneTime = await createSubscriber({ servicePlan: oneTimePlan });

    await recurring.createRecurringServices({ now: MONDAY_EARLY });

    expect(await servicesFor(active.subscription.id)).toHaveLength(1);
    for (const skipped of [cancelled, suspended, ended, endsSoon, notStarted, oneTime]) {
      expect(await servicesFor(skipped.subscription.id)).toHaveLength(0);
    }
  });

  it('skips and logs subscriptions without a valid preferred day', async () => {
    const missing = await createSubscriber({ serviceDay: null });
    const invalid = await createSubscriber({ serviceDay: 'whenever' });
    const result = await recurring.createRecurringServices({ now: MONDAY_EARLY });

    expect(result.created).toBe(0);
    expect(result.missingServiceDay.map((m) => m.subscriptionId).sort()).toEqual(
      [missing.subscription.id, invalid.subscription.id].sort()
    );
    const log = await prisma.systemLog.findFirst({ where: { type: 'RECURRING_SERVICE_NO_DAY' } });
    expect(log).not.toBeNull();
  });

  it('does not add a second visit in a week when the customer changes their day', async () => {
    const { customer, subscription } = await createSubscriber({ serviceDay: 'wednesday' });
    await recurring.createRecurringServices({ now: MONDAY_EARLY });
    await prisma.customer.update({ where: { id: customer.id }, data: { serviceDay: 'friday' } });
    await recurring.createRecurringServices({ now: MONDAY_EARLY });

    const visits = await servicesFor(subscription.id);
    expect(visits).toHaveLength(1);
    expect(visits[0].serviceDate.toISOString().slice(0, 10)).toBe('2026-11-11');

    // The next week picks up the new day.
    await recurring.createRecurringServices({ now: new Date('2026-11-16T11:00:00Z') });
    const later = await servicesFor(subscription.id);
    expect(later.map((v) => v.serviceDate.toISOString().slice(0, 10))).toEqual(['2026-11-11', '2026-11-20']);
  });

  it('a rolled-over visit is not recreated by the next run', async () => {
    const { subscription } = await createSubscriber({ serviceDay: 'monday' });
    await recurring.createRecurringServices({ now: MONDAY_EARLY });

    // Nobody claims Monday's visit; Tuesday morning the pool rolls it onto Tuesday.
    const tuesdayMorning = new Date('2026-11-10T12:00:00Z');
    const { requeued } = await claims.requeueOverdueUnclaimed({ now: tuesdayMorning });
    expect(requeued).toBe(1);
    const [rolled] = await servicesFor(subscription.id);
    expect(rolled.scheduledDate.toISOString()).toBe('2026-11-10T14:00:00.000Z');
    expect(rolled.serviceDate.toISOString().slice(0, 10)).toBe('2026-11-09');

    await recurring.createRecurringServices({ now: tuesdayMorning });
    const visits = await servicesFor(subscription.id);
    // Still the rolled visit for this week; next Monday is created in its own week.
    expect(visits.map((v) => v.serviceDate.toISOString().slice(0, 10))).toEqual(['2026-11-09', '2026-11-16']);
  });

  it('rolls over by Denver day, not UTC day', async () => {
    const { subscription } = await createSubscriber({ serviceDay: 'monday' });
    await recurring.createRecurringServices({ now: MONDAY_EARLY });

    // 22:00 MST Monday is already Tuesday in UTC; Monday's visit is not overdue yet.
    const { requeued } = await claims.requeueOverdueUnclaimed({ now: new Date('2026-11-10T05:00:00Z') });
    expect(requeued).toBe(0);
    const [visit] = await servicesFor(subscription.id);
    expect(visit.scheduledDate.toISOString()).toBe('2026-11-09T14:00:00.000Z');
  });

  describe('payout report', () => {
    async function completedVisit({ employeeId, completedDate, potentialEarnings = 9.97 }) {
      const { customer } = await createSubscriber();
      return prisma.service.create({
        data: {
          id: id('svc'),
          customerId: customer.id,
          servicePlanId: plan.id,
          employeeId,
          scheduledDate: completedDate,
          completedDate,
          status: 'COMPLETED',
          paymentStatus: 'PENDING',
          potentialEarnings,
          updatedAt: new Date(),
        },
      });
    }

    async function createEmployee() {
      const user = await prisma.user.create({
        data: {
          id: id('user'),
          email: `${id('scooper')}@example.com`,
          password: 'x',
          role: 'EMPLOYEE',
          firstName: 'Sam',
          lastName: 'Scooper',
          updatedAt: new Date(),
        },
      });
      return prisma.employee.create({ data: { id: id('emp'), userId: user.id, updatedAt: new Date() } });
    }

    it('reports what is owed for last week and pays nothing', async () => {
      jest.useFakeTimers({
        now: new Date('2026-11-13T16:00:00Z'),
        doNotFake: ['hrtime', 'nextTick', 'performance', 'queueMicrotask', 'setImmediate', 'clearImmediate', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'],
      });
      try {
        const employee = await createEmployee();
        // Last week (Mon Nov 2 - Sun Nov 8, Denver): two visits. This week: one, not reported.
        const a = await completedVisit({ employeeId: employee.id, completedDate: new Date('2026-11-02T18:00:00Z') });
        const b = await completedVisit({ employeeId: employee.id, completedDate: new Date('2026-11-09T05:00:00Z') });
        await completedVisit({ employeeId: employee.id, completedDate: new Date('2026-11-10T18:00:00Z') });

        const res = await routes.payouts.GET(cronRequest('/api/cron/process-employee-payouts'));
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.payoutsEnabled).toBe(false);
        expect(body.mode).toBe('report-only');
        expect(body.week).toEqual({ start: '2026-11-02', end: '2026-11-08', timeZone: 'America/Denver' });
        expect(body.summary).toEqual({ employeesOwed: 1, servicesUnpaid: 2, totalOwed: 19.94 });
        expect(body.owed[0]).toMatchObject({ employeeId: employee.id, employeeName: 'Sam Scooper', serviceCount: 2, amountOwed: 19.94 });

        expect(await prisma.payout.count()).toBe(0);
        expect(await prisma.earning.count()).toBe(0);
        expect(await prisma.notification.count()).toBe(0);
        const after = await prisma.service.findMany({ where: { id: { in: [a.id, b.id] } } });
        expect(after.every((s) => s.paymentStatus === 'PENDING')).toBe(true);
        expect(await prisma.systemLog.count({ where: { type: 'PAYOUT_REPORT' } })).toBe(1);
      } finally {
        jest.useRealTimers();
      }
    });

    it('returns 200 with nothing owed', async () => {
      const res = await routes.payouts.POST(cronRequest('/api/cron/process-employee-payouts', 'POST'));
      expect(res.status).toBe(200);
      expect((await res.json()).summary.totalOwed).toBe(0);
    });
  });
});
