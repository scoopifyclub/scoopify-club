/**
 * @jest-environment node
 *
 * Scooper payouts against a real Postgres with an in-memory Stripe that
 * honours idempotency keys and transfer_group lookups like Stripe does.
 * Needs TEST_DATABASE_URL pointing at a local, disposable database whose
 * name contains "test" (tables are truncated). Run with: npm run test:cron
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
process.env.JWT_SECRET = 'scooper-payouts-test-secret';
process.env.ADMIN_EMAILS = 'owner@scoopify.club';
process.env.CRON_SECRET = 'cron-secret-for-payout-tests';
process.env.STRIPE_SECRET_KEY = 'sk_test_payouts';
process.env.STRIPE_CONNECT_WEBHOOK_SECRET = 'whsec_connect_test';
process.env.STRIPE_PAYOUTS_WEBHOOK_SECRET = 'whsec_platform_test';

jest.unmock('@/lib/prisma');

const describeDb = TEST_DATABASE_URL ? describe : describe.skip;
if (!TEST_DATABASE_URL) {
  console.warn('Skipping scooper payout DB tests: set TEST_DATABASE_URL (see npm run test:cron).');
}

const BASE = 'http://localhost:3000';
// Friday 2026-11-13 09:00 MST: pays the Denver week Mon Nov 2 - Sun Nov 8.
const FRIDAY = new Date('2026-11-13T16:00:00Z');
const NEXT_FRIDAY = new Date('2026-11-20T16:00:00Z');
const LAST_WEEK = new Date('2026-11-04T18:00:00Z');
const THIS_WEEK = new Date('2026-11-10T18:00:00Z');

class StripeNetworkError extends Error {
  constructor() {
    super('Network error: connection reset');
    this.type = 'StripeConnectionError';
  }
}

function fakeStripe() {
  const created = [];
  const byKey = new Map();
  let nextFailure = null;
  let seq = 0;
  return {
    created,
    failNextTransfer(kind) {
      nextFailure = kind;
    },
    transfers: {
      list: async ({ transfer_group }) => ({ data: created.filter((t) => t.transfer_group === transfer_group) }),
      create: async (params, options = {}) => {
        const failure = nextFailure;
        nextFailure = null;
        if (failure === 'declined') {
          const error = new Error('Insufficient funds in Stripe account');
          error.code = 'balance_insufficient';
          throw error;
        }
        const key = options.idempotencyKey;
        if (!key) throw new Error('transfers must use an idempotency key');
        let transfer = byKey.get(key);
        if (transfer && (transfer.amount !== params.amount || transfer.destination !== params.destination)) {
          throw new Error('Keys for idempotent requests can only be used with the same parameters');
        }
        if (!transfer) {
          transfer = { id: `tr_test_${++seq}`, object: 'transfer', ...params };
          byKey.set(key, transfer);
          created.push(transfer);
        }
        await new Promise((resolve) => setTimeout(resolve, 5));
        // The transfer exists at Stripe but the response never arrives.
        if (failure === 'lost-response') throw new StripeNetworkError();
        return transfer;
      },
    },
  };
}

describeDb('scooper payouts (real Postgres)', () => {
  let prisma;
  let payouts;
  let holds;
  let calculator;
  let connect;
  let reconciliation;
  let routes;
  let seq = 0;
  let monthlyPlan;
  let oneTimePlan;

  const id = (prefix) => `${prefix}-${++seq}-${Math.random().toString(36).slice(2, 8)}`;

  beforeAll(async () => {
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: 'pipe',
    });
    ({ prisma } = require('@/lib/prisma'));
    payouts = require('@/lib/scooper-payouts');
    holds = require('@/lib/payout-holds');
    calculator = require('@/lib/payment-calculator');
    connect = require('@/lib/stripe-connect');
    reconciliation = require('@/lib/payout-reconciliation');
    routes = {
      cron: require('@/app/api/cron/process-employee-payouts/route'),
      webhook: require('@/app/api/webhooks/stripe-payouts/route'),
    };
  }, 120000);

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  beforeEach(async () => {
    delete process.env.PAYOUTS_ENABLED;
    delete process.env.PAYOUTS_ALLOW_LIVE;
    process.env.STRIPE_SECRET_KEY = 'sk_test_payouts';
    await prisma.$executeRawUnsafe(
      'TRUNCATE "PayoutHold", "Earning", "Payout", "Payment", "ServicePhoto", "Service", "Subscription", "ServicePlan", "Customer", "Employee", "User", "SystemLog" CASCADE'
    );
    monthlyPlan = await prisma.servicePlan.create({
      data: { id: id('plan'), name: 'Weekly 1 dog', price: 79, duration: 30, type: 'MONTHLY', updatedAt: new Date() },
    });
    oneTimePlan = await prisma.servicePlan.create({
      data: { id: id('plan'), name: 'One-time cleanup', price: 99, duration: 60, type: 'ONE_TIME', updatedAt: new Date() },
    });
  });

  async function createUser(role, firstName) {
    return prisma.user.create({
      data: { id: id('user'), email: `${id(role.toLowerCase())}@example.com`, password: 'x', role, firstName, lastName: 'Test', updatedAt: new Date() },
    });
  }

  async function createScooper({ ready = true } = {}) {
    const user = await createUser('EMPLOYEE', 'Sam');
    return prisma.employee.create({
      data: {
        id: id('emp'),
        userId: user.id,
        status: 'ACTIVE',
        approvedAt: new Date('2026-10-01T00:00:00Z'),
        stripeConnectAccountId: `acct_${id('x').replace(/-/g, '')}`,
        stripeAccountStatus: ready ? 'ACTIVE' : 'PENDING',
        stripePayoutsEnabled: ready,
        stripeDetailsSubmitted: ready,
        updatedAt: new Date(),
      },
    });
  }

  async function createCustomer() {
    const user = await createUser('CUSTOMER', 'Casey');
    return prisma.customer.create({
      data: { id: id('cust'), userId: user.id, stripeCustomerId: `cus_${id('x').replace(/-/g, '')}`, updatedAt: new Date() },
    });
  }

  async function completedJob({ scooper, customer, completedDate = LAST_WEEK, plan = monthlyPlan, afterPhoto = true, status = 'COMPLETED', paymentStatus = 'PENDING', potentialEarnings = 1.23 }) {
    const owner = customer || (await createCustomer());
    const service = await prisma.service.create({
      data: {
        id: id('svc'),
        customerId: owner.id,
        servicePlanId: plan.id,
        employeeId: scooper.id,
        scheduledDate: completedDate,
        completedDate: status === 'COMPLETED' ? completedDate : null,
        status,
        paymentStatus,
        potentialEarnings,
        updatedAt: new Date(),
      },
    });
    if (afterPhoto) {
      await prisma.servicePhoto.create({
        data: { id: id('photo'), serviceId: service.id, type: 'AFTER', url: 'https://example.com/after.jpg', updatedAt: new Date() },
      });
    }
    return { service, customer: owner };
  }

  const earningFor = (serviceId, kind = 'JOB') =>
    prisma.earning.findUnique({ where: { serviceId_kind: { serviceId, kind } } });

  const run = (stripe, now = FRIDAY) => payouts.runPayouts({ stripe, now, transfer: true });

  describe('pay rules', () => {
    it('pays monthly price x 12 / 52 x 75% per visit and 75% of one-time jobs, before fees', () => {
      expect(calculator.scooperEarningPerVisit(79)).toBe(13.67);
      expect(calculator.scooperEarningPerVisit(55)).toBe(9.52);
      expect(calculator.scooperEarningOneTime(99)).toBe(74.25);
      expect(calculator.scooperEarningForPlan({ type: 'MONTHLY', price: 89 })).toBe(15.40);
      expect(calculator.scooperEarningForPlan({ type: 'INITIAL_CLEANUP', price: 49 })).toBe(36.75);
      expect(calculator.scooperEarningForPlan({ type: 'MONTHLY', price: 0 })).toBeNull();
      // Referrals and Stripe fees no longer reduce scooper pay.
      expect(calculator.calculateMonthlyServicePayment(79, 'CUSTOMER').scooperPaymentPerService).toBe(13.67);
    });

    it('records earnings only for verified completed jobs, priced from the plan', async () => {
      const scooper = await createScooper();
      const { service: monthly } = await completedJob({ scooper });
      const { service: oneTime } = await completedJob({ scooper, plan: oneTimePlan });
      const { service: noPhoto } = await completedJob({ scooper, afterPhoto: false });
      const { service: inProgress } = await completedJob({ scooper, status: 'IN_PROGRESS' });
      const { service: paidByHand } = await completedJob({ scooper, paymentStatus: 'PAID' });

      const result = await payouts.syncEarnings({ now: FRIDAY });
      expect(result.created).toBe(2);
      expect((await earningFor(monthly.id)).amount).toBe(13.67);
      expect((await earningFor(oneTime.id)).amount).toBe(74.25);
      for (const s of [noPhoto, inProgress, paidByHand]) expect(await earningFor(s.id)).toBeNull();

      await payouts.syncEarnings({ now: FRIDAY });
      expect(await prisma.earning.count()).toBe(2);
    });
  });

  describe('weekly transfers', () => {
    it('reports without moving money unless PAYOUTS_ENABLED=true', async () => {
      const scooper = await createScooper();
      await completedJob({ scooper });
      const stripe = fakeStripe();

      const result = await payouts.runPayouts({ stripe, now: FRIDAY });
      expect(result.mode).toBe('report-only');
      expect(result.summary.wouldPay).toBe(13.67);
      expect(stripe.created).toHaveLength(0);
      expect(await prisma.payout.count()).toBe(0);
      expect((await prisma.earning.findFirst()).status).toBe('PENDING');
    });

    it('pays each scooper one transfer for last week and never pays it again', async () => {
      const alice = await createScooper();
      const bob = await createScooper();
      const { service: a1 } = await completedJob({ scooper: alice });
      await completedJob({ scooper: alice, plan: oneTimePlan });
      await completedJob({ scooper: bob });
      const { service: thisWeek } = await completedJob({ scooper: alice, completedDate: THIS_WEEK });
      const stripe = fakeStripe();

      const first = await run(stripe);
      expect(first.mode).toBe('transfer');
      expect(first.period).toEqual({ start: '2026-11-02', end: '2026-11-08', timeZone: 'America/Denver' });
      expect(stripe.created).toHaveLength(2);
      const toAlice = stripe.created.find((t) => t.destination === alice.stripeConnectAccountId);
      expect(toAlice.amount).toBe(1367 + 7425);
      expect(toAlice.currency).toBe('usd');
      expect(first.summary.paid).toBe(13.67 + 74.25 + 13.67);

      const payout = await prisma.payout.findFirst({ where: { employeeId: alice.id }, include: { earnings: true } });
      expect(payout).toMatchObject({ status: 'PAID', amount: 87.92, serviceCount: 2, stripeTransferId: toAlice.id });
      expect(payout.earnings.every((e) => e.status === 'PAID')).toBe(true);
      expect((await prisma.service.findUnique({ where: { id: a1.id } })).paymentStatus).toBe('PAID');
      // This week's job waits for next Friday.
      expect(await earningFor(thisWeek.id)).toBeNull();

      const again = await run(stripe);
      expect(stripe.created).toHaveLength(2);
      expect(again.summary.transfers).toBe(0);
      expect(await prisma.payout.count()).toBe(2);

      await run(stripe, NEXT_FRIDAY);
      expect(stripe.created).toHaveLength(3);
      expect(stripe.created[2]).toMatchObject({ destination: alice.stripeConnectAccountId, amount: 1367 });
    });

    it('sends one transfer per scooper when runs overlap', async () => {
      const scoopers = [await createScooper(), await createScooper(), await createScooper()];
      for (const scooper of scoopers) {
        await completedJob({ scooper });
        await completedJob({ scooper });
      }
      const stripe = fakeStripe();

      await Promise.all([run(stripe), run(stripe), run(stripe), run(stripe)]);
      await run(stripe);

      expect(stripe.created).toHaveLength(3);
      expect(new Set(stripe.created.map((t) => t.destination)).size).toBe(3);
      expect(stripe.created.every((t) => t.amount === 2734)).toBe(true);
      expect(await prisma.payout.count({ where: { status: 'PAID' } })).toBe(3);
      expect(await prisma.earning.count({ where: { status: 'PAID' } })).toBe(6);
    });

    it('does not pay twice when Stripe made the transfer but the response was lost', async () => {
      const scooper = await createScooper();
      await completedJob({ scooper });
      const stripe = fakeStripe();
      stripe.failNextTransfer('lost-response');

      const first = await run(stripe);
      expect(first.results[0].status).toBe('FAILED');
      expect(stripe.created).toHaveLength(1);
      expect((await prisma.payout.findFirst()).status).toBe('FAILED');
      expect((await prisma.earning.findFirst()).status).toBe('PROCESSING');

      const retry = await run(stripe);
      expect(retry.results[0]).toMatchObject({ status: 'PAID', retried: true, transferId: stripe.created[0].id });
      expect(stripe.created).toHaveLength(1);
      expect((await prisma.payout.findFirst()).status).toBe('PAID');
    });

    it('retries a declined transfer with the same amount on the next run', async () => {
      const scooper = await createScooper();
      await completedJob({ scooper });
      const stripe = fakeStripe();
      stripe.failNextTransfer('declined');

      await run(stripe);
      expect(stripe.created).toHaveLength(0);
      expect((await prisma.payout.findFirst()).failureReason).toMatch(/Insufficient funds/);

      // A job finished meanwhile is not added to the failed payout.
      await completedJob({ scooper, completedDate: new Date('2026-11-05T18:00:00Z') });
      await run(stripe);
      expect(stripe.created).toHaveLength(1);
      expect(stripe.created[0].amount).toBe(1367);
      expect(await prisma.earning.count({ where: { status: 'PENDING' } })).toBe(1);
    });

    it('waits for Stripe onboarding, then pays once account.updated reports payouts enabled', async () => {
      const scooper = await createScooper({ ready: false });
      await completedJob({ scooper });
      const stripe = fakeStripe();

      const before = await run(stripe);
      expect(before.results[0].status).toBe('NEEDS_ONBOARDING');
      expect(stripe.created).toHaveLength(0);

      await connect.syncConnectAccount({
        id: scooper.stripeConnectAccountId,
        payouts_enabled: true,
        details_submitted: true,
        capabilities: { transfers: 'active' },
      });
      await run(stripe);
      expect(stripe.created).toHaveLength(1);
    });

    it('refuses live keys unless PAYOUTS_ALLOW_LIVE=true', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_live_not_really';
      const scooper = await createScooper();
      await completedJob({ scooper });
      const stripe = fakeStripe();

      const result = await run(stripe);
      expect(result.mode).toBe('report-only');
      expect(result.blockedReason).toMatch(/live key/);
      expect(stripe.created).toHaveLength(0);
    });
  });

  describe('refunds and disputes', () => {
    async function paymentFor(service, customer, { intent = `pi_${id('x')}`, serviceLinked = true } = {}) {
      return prisma.payment.create({
        data: {
          id: id('pay'),
          amount: 99,
          type: serviceLinked ? 'ONE_TIME_PAYMENT' : 'SUBSCRIPTION_RENEWAL',
          customerId: customer.id,
          serviceId: serviceLinked ? service.id : null,
          stripePaymentIntentId: intent,
          status: 'PAID',
          updatedAt: new Date(),
        },
      });
    }

    it('holds a disputed customer\'s jobs and releases them when the dispute is won', async () => {
      const scooper = await createScooper();
      const { service, customer } = await completedJob({ scooper });
      const payment = await paymentFor(service, customer, { serviceLinked: false });
      const stripe = fakeStripe();
      const dispute = { id: 'dp_1', charge: 'ch_1', payment_intent: payment.stripePaymentIntentId, amount: 7900, status: 'needs_response' };

      await holds.handleDispute(dispute);
      await holds.handleDispute(dispute);
      expect(await prisma.payoutHold.count()).toBe(1);

      await run(stripe);
      expect(stripe.created).toHaveLength(0);
      expect((await earningFor(service.id)).status).toBe('HELD');

      await holds.handleDispute({ ...dispute, status: 'won' });
      await run(stripe);
      expect(stripe.created).toHaveLength(1);
      expect((await earningFor(service.id)).status).toBe('PAID');
    });

    it('voids an unpaid job when its payment is fully refunded', async () => {
      const scooper = await createScooper();
      const { service, customer } = await completedJob({ scooper, plan: oneTimePlan });
      const payment = await paymentFor(service, customer);
      const stripe = fakeStripe();

      const charge = { id: 'ch_r1', payment_intent: payment.stripePaymentIntentId, customer: customer.stripeCustomerId, amount: 9900, amount_refunded: 9900, refunded: true };
      await holds.handleChargeRefunded(charge);
      await holds.handleChargeRefunded(charge);

      await run(stripe);
      expect(stripe.created).toHaveLength(0);
      expect((await earningFor(service.id)).status).toBe('VOID');
    });

    it('claws back an already-paid job from the next payout', async () => {
      const scooper = await createScooper();
      const { service, customer } = await completedJob({ scooper, plan: oneTimePlan });
      const payment = await paymentFor(service, customer);
      const stripe = fakeStripe();
      const REFUNDED_AT = new Date('2026-11-13T17:00:00Z');
      await run(stripe);
      expect(stripe.created[0].amount).toBe(7425);

      await holds.handleChargeRefunded({ id: 'ch_r2', payment_intent: payment.stripePaymentIntentId, amount: 9900, amount_refunded: 9900, refunded: true }, { now: REFUNDED_AT });
      await holds.handleChargeRefunded({ id: 'ch_r2', payment_intent: payment.stripePaymentIntentId, amount: 9900, amount_refunded: 9900, refunded: true }, { now: REFUNDED_AT });
      expect((await earningFor(service.id, 'CLAWBACK')).amount).toBe(-74.25);

      // Next week: one $13.67 job does not cover the $74.25 clawback, so nothing is sent.
      await completedJob({ scooper, completedDate: THIS_WEEK });
      const short = await run(stripe, NEXT_FRIDAY);
      expect(short.results[0]).toMatchObject({ status: 'CARRIED_FORWARD', amount: -60.58 });
      expect(stripe.created).toHaveLength(1);

      // Two one-time jobs later the balance is positive and the net is paid.
      await completedJob({ scooper, plan: oneTimePlan, completedDate: new Date('2026-11-17T18:00:00Z') });
      await completedJob({ scooper, plan: oneTimePlan, completedDate: new Date('2026-11-18T18:00:00Z') });
      await run(stripe, new Date('2026-11-27T16:00:00Z'));
      expect(stripe.created).toHaveLength(2);
      expect(stripe.created[1].amount).toBe(1367 + 7425 + 7425 - 7425);
      expect((await earningFor(service.id, 'CLAWBACK')).status).toBe('PAID');
    });

    it('holds a customer after a partial or subscription refund until an admin decides', async () => {
      const scooper = await createScooper();
      const { service: s1, customer } = await completedJob({ scooper });
      const { service: s2 } = await completedJob({ scooper, customer });
      const payment = await paymentFor(s1, customer, { serviceLinked: false });
      const stripe = fakeStripe();

      const { holdId } = await holds.handleChargeRefunded({ id: 'ch_sub', payment_intent: payment.stripePaymentIntentId, amount: 7900, amount_refunded: 2000, refunded: false });
      await run(stripe);
      expect(stripe.created).toHaveLength(0);

      const other = await createCustomer();
      const rejected = await holds.resolveHold({ holdId, action: 'void', serviceIds: [s1.id, (await completedJob({ scooper, customer: other })).service.id] });
      expect(rejected.status).toBe(400);

      await holds.resolveHold({ holdId, action: 'void', serviceIds: [s1.id], adminId: 'admin-1' });
      expect((await earningFor(s1.id)).status).toBe('VOID');
      expect((await earningFor(s2.id)).status).toBe('PENDING');
      expect((await prisma.payoutHold.findUnique({ where: { id: holdId } })).status).toBe('RESOLVED');

      await run(stripe);
      expect(stripe.created).toHaveLength(1);
      expect(stripe.created[0].amount).toBe(1367 + 1367);
    });
  });

  describe('scooper view and reconciliation', () => {
    it('shows the scooper their earnings, holds and payouts', async () => {
      const scooper = await createScooper();
      await completedJob({ scooper });
      await completedJob({ scooper, completedDate: THIS_WEEK });
      await run(fakeStripe());

      const view = await payouts.employeePayoutSummary(await prisma.employee.findUnique({ where: { id: scooper.id } }), { now: FRIDAY });
      expect(view.account).toMatchObject({ connected: true, readyForTransfers: true });
      expect(view.totals).toMatchObject({ paid: 13.67, pending: 13.67 });
      expect(view.nextPayoutDate).toBe('2026-11-13');
      expect(view.payouts).toHaveLength(1);
      expect(view.payouts[0]).toMatchObject({ status: 'PAID', amount: 13.67, jobCount: 1 });
    });

    it('reconciles revenue, fees, scooper payouts and margin', async () => {
      const scooper = await createScooper();
      const { customer } = await completedJob({ scooper, plan: oneTimePlan });
      await prisma.payment.create({
        data: { id: id('pay'), amount: 99, stripeFee: 3.17, type: 'ONE_TIME_PAYMENT', customerId: customer.id, status: 'PAID', paidAt: LAST_WEEK, updatedAt: new Date() },
      });
      const stripe = fakeStripe();
      await run(stripe);
      const transferId = stripe.created[0].id;
      stripe.balanceTransactions = {
        list: () => (async function* list() {
          yield { type: 'charge', amount: 9900, fee: 317, source: 'ch_1' };
          yield { type: 'transfer', amount: -7425, fee: 0, source: transferId };
          yield { type: 'stripe_fee', amount: -200, fee: 0, source: null };
        })(),
      };

      const report = await reconciliation.payoutReconciliation({ stripe, from: '2026-11-01', to: '2026-11-14' });
      expect(report.ledger).toMatchObject({ revenue: 99, stripeFeesRecorded: 3.17, scooperPayouts: 74.25, scoopifyMargin: 21.58 });
      expect(report.stripe).toMatchObject({ grossRevenue: 99, stripeFees: 3.17, connectFees: 2, scooperTransfers: 74.25, scoopifyMargin: 19.58 });
      expect(report.issues).toEqual([]);
    });
  });

  describe('routes', () => {
    const cronRequest = () =>
      new NextRequest(`${BASE}/api/cron/process-employee-payouts`, { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } });

    it('the Friday cron reports only while PAYOUTS_ENABLED is unset', async () => {
      const scooper = await createScooper();
      await completedJob({ scooper, completedDate: new Date(Date.now() - 8 * 24 * 3600 * 1000) });
      const res = await routes.cron.GET(cronRequest());
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body).toMatchObject({ payoutsEnabled: false, mode: 'report-only' });
      expect(await prisma.payout.count()).toBe(0);
      expect(await prisma.systemLog.count({ where: { type: 'PAYOUT_REPORT' } })).toBe(1);
    });

    it('the cron rejects requests without the cron secret', async () => {
      const res = await routes.cron.GET(new NextRequest(`${BASE}/api/cron/process-employee-payouts`));
      expect(res.status).toBe(401);
    });

    it('the payouts webhook verifies signatures and stores account.updated', async () => {
      const Stripe = require('stripe');
      const stripeLib = new Stripe('sk_test_signing');
      const scooper = await createScooper({ ready: false });
      const payload = JSON.stringify({
        id: 'evt_1',
        type: 'account.updated',
        data: { object: { id: scooper.stripeConnectAccountId, payouts_enabled: true, details_submitted: true, capabilities: { transfers: 'active' } } },
      });
      const post = (secret) => routes.webhook.POST(new NextRequest(`${BASE}/api/webhooks/stripe-payouts`, {
        method: 'POST',
        body: payload,
        headers: { 'stripe-signature': stripeLib.webhooks.generateTestHeaderString({ payload, secret }) },
      }));

      expect((await post('whsec_wrong')).status).toBe(400);
      expect((await prisma.employee.findUnique({ where: { id: scooper.id } })).stripePayoutsEnabled).toBe(false);

      const res = await post(process.env.STRIPE_CONNECT_WEBHOOK_SECRET);
      expect(res.status).toBe(200);
      const updated = await prisma.employee.findUnique({ where: { id: scooper.id } });
      expect(updated).toMatchObject({ stripePayoutsEnabled: true, stripeDetailsSubmitted: true, stripeAccountStatus: 'ACTIVE' });
    });
  });
});
