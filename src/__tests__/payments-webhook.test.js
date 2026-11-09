/**
 * @jest-environment node
 */
import Stripe from 'stripe';

const WEBHOOK_SECRET = 'whsec_test_payments';
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
process.env.STRIPE_MONTHLY_1_DOG_PRICE_ID = 'price_monthly_1';
process.env.STRIPE_MONTHLY_2_DOGS_PRICE_ID = 'price_monthly_2';
process.env.STRIPE_ONETIME_1_DOG_PRICE_ID = 'price_onetime_1';

const realStripe = new Stripe('sk_test_dummy', { apiVersion: '2023-10-16' });

// In-memory Prisma with unique constraints and transaction rollback, enough
// to exercise the webhook the way Postgres would.
const UNIQUE = {
  stripeEvent: ['id'],
  subscription: ['id', 'stripeSubscriptionId'],
  payment: ['id', 'stripeInvoiceId', 'stripePaymentIntentId'],
  customer: ['id', 'stripeCustomerId', 'userId'],
  user: ['id', 'email'],
  servicePlan: ['id', 'code', 'stripePriceId'],
};
const mockDb = { tables: {}, failOn: null };
const resetDb = () => {
  mockDb.tables = Object.fromEntries(Object.keys(UNIQUE).map((m) => [m, []]));
  mockDb.failOn = null;
};

jest.mock('@/lib/prisma', () => {
  const uniqueError = (model, field) => Object.assign(new Error(`Unique constraint failed on ${model}.${field}`), { code: 'P2002' });
  const matches = (row, where) => Object.entries(where).every(([k, v]) => row[k] === v);
  const delegate = (model) => {
    const rows = () => mockDb.tables[model];
    const check = (model_, row, selfId) => {
      for (const field of UNIQUE[model_]) {
        if (row[field] == null) continue;
        if (rows().some((r) => r.id !== selfId && r[field] === row[field])) throw uniqueError(model_, field);
      }
    };
    const guard = (op) => {
      if (mockDb.failOn === `${model}.${op}`) throw new Error(`Simulated DB failure on ${model}.${op}`);
    };
    const withInclude = (row, include) => {
      if (!row) return null;
      const out = { ...row };
      if (include?.customer && model === 'user') {
        const c = mockDb.tables.customer.find((x) => x.userId === row.id);
        out.customer = c ? { ...c } : null;
      }
      return out;
    };
    const api = {
      findUnique: async ({ where, include }) => withInclude(rows().find((r) => matches(r, where)), include),
      findFirst: async ({ where = {}, include } = {}) => withInclude(rows().find((r) => matches(r, where)), include),
      findMany: async ({ where = {} } = {}) => rows().filter((r) => matches(r, where)).map((r) => ({ ...r })),
      count: async ({ where = {} } = {}) => rows().filter((r) => matches(r, where)).length,
      create: async ({ data }) => {
        guard('create');
        check(model, data, undefined);
        rows().push({ ...data });
        return { ...data };
      },
      update: async ({ where, data }) => {
        guard('update');
        const row = rows().find((r) => matches(r, where));
        if (!row) throw Object.assign(new Error('Record not found'), { code: 'P2025' });
        check(model, { ...row, ...data }, row.id);
        Object.assign(row, data);
        return { ...row };
      },
      upsert: async ({ where, create, update }) => {
        const row = rows().find((r) => matches(r, where));
        return row ? api.update({ where: { id: row.id }, data: update }) : api.create({ data: create });
      },
    };
    return api;
  };
  const prisma = Object.fromEntries(Object.keys(UNIQUE).map((m) => [m, delegate(m)]));
  prisma.$transaction = async (fn) => {
    const snapshot = JSON.parse(JSON.stringify(mockDb.tables));
    try {
      return await fn(prisma);
    } catch (error) {
      mockDb.tables = snapshot;
      throw error;
    }
  };
  return { __esModule: true, prisma, default: prisma };
});

const mockStripeObjects = { subscriptions: new Map(), customers: new Map() };
jest.mock('@/lib/stripe', () => {
  const StripeSdk = jest.requireActual('stripe');
  const sdk = new StripeSdk('sk_test_dummy', { apiVersion: '2023-10-16' });
  const notFound = (id) => Object.assign(new Error(`No such object: ${id}`), { type: 'StripeInvalidRequestError' });
  return {
    __esModule: true,
    stripe: {
      webhooks: sdk.webhooks,
      subscriptions: {
        retrieve: jest.fn(async (id) => {
          if (!mockStripeObjects.subscriptions.has(id)) throw notFound(id);
          return mockStripeObjects.subscriptions.get(id);
        }),
      },
      customers: {
        retrieve: jest.fn(async (id) => {
          if (!mockStripeObjects.customers.has(id)) throw notFound(id);
          return mockStripeObjects.customers.get(id);
        }),
      },
    },
  };
});

const { POST } = require('@/app/api/webhooks/stripe/route');

let eventCounter = 0;
function makeEvent(type, object, id = `evt_${++eventCounter}`) {
  return { id, object: 'event', type, api_version: '2023-10-16', created: 1762700000, data: { object } };
}

function deliver(event, { secret = WEBHOOK_SECRET } = {}) {
  const payload = JSON.stringify(event);
  const signature = realStripe.webhooks.generateTestHeaderString({ payload, secret });
  return POST(new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    body: payload,
    headers: { 'stripe-signature': signature, 'content-type': 'application/json' },
  }));
}

const PERIOD_START = 1762700000;
const PERIOD_END = PERIOD_START + 30 * 86400;

function stripeSubscription(overrides = {}) {
  return {
    id: 'sub_123',
    object: 'subscription',
    customer: 'cus_123',
    status: 'active',
    start_date: PERIOD_START,
    current_period_start: PERIOD_START,
    current_period_end: PERIOD_END,
    cancel_at_period_end: false,
    canceled_at: null,
    ended_at: null,
    metadata: {},
    items: { data: [{ price: { id: 'price_monthly_1', unit_amount: 5500 } }] },
    ...overrides,
  };
}

function invoice(overrides = {}) {
  return {
    id: 'in_123',
    object: 'invoice',
    customer: 'cus_123',
    customer_email: 'jane@example.com',
    subscription: 'sub_123',
    billing_reason: 'subscription_create',
    amount_paid: 5500,
    amount_due: 5500,
    attempt_count: 1,
    payment_intent: 'pi_invoice_123',
    status_transitions: { paid_at: PERIOD_START + 60 },
    lines: { data: [{ period: { start: PERIOD_START, end: PERIOD_END } }] },
    ...overrides,
  };
}

function checkoutSession(overrides = {}) {
  return {
    id: 'cs_123',
    object: 'checkout.session',
    mode: 'subscription',
    customer: 'cus_123',
    subscription: 'sub_123',
    payment_status: 'paid',
    client_reference_id: null,
    customer_details: { email: 'Jane@Example.com' },
    metadata: { planId: 'single-dog-monthly' },
    ...overrides,
  };
}

function seedCustomer({ stripeCustomerId = null } = {}) {
  mockDb.tables.user.push({ id: 'user_1', email: 'jane@example.com', role: 'CUSTOMER' });
  mockDb.tables.customer.push({ id: 'cust_1', userId: 'user_1', stripeCustomerId });
}

beforeEach(() => {
  resetDb();
  mockStripeObjects.subscriptions = new Map([['sub_123', stripeSubscription()]]);
  mockStripeObjects.customers = new Map([['cus_123', { id: 'cus_123', email: 'jane@example.com' }]]);
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('Stripe webhook: signature and configuration', () => {
  it('rejects a bad signature with 400 and writes nothing', async () => {
    seedCustomer();
    const res = await deliver(makeEvent('invoice.paid', invoice()), { secret: 'whsec_wrong' });
    expect(res.status).toBe(400);
    expect(mockDb.tables.payment).toHaveLength(0);
    expect(mockDb.tables.stripeEvent).toHaveLength(0);
  });

  it('acknowledges unhandled event types without recording them', async () => {
    const res = await deliver(makeEvent('customer.updated', { id: 'cus_123' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ignored: true });
    expect(mockDb.tables.stripeEvent).toHaveLength(0);
  });
});

describe('Stripe webhook: subscription checkout', () => {
  it('checkout + subscription.created + invoice.paid yield 1 Subscription and 1 PAID Payment', async () => {
    seedCustomer();
    for (const event of [
      makeEvent('checkout.session.completed', checkoutSession()),
      makeEvent('customer.subscription.created', stripeSubscription()),
      makeEvent('invoice.paid', invoice()),
      makeEvent('invoice.payment_succeeded', invoice()),
    ]) {
      expect((await deliver(event)).status).toBe(200);
    }

    expect(mockDb.tables.subscription).toHaveLength(1);
    const [sub] = mockDb.tables.subscription;
    expect(sub).toMatchObject({
      customerId: 'cust_1',
      stripeSubscriptionId: 'sub_123',
      status: 'ACTIVE',
      nextBillingDate: new Date(PERIOD_END * 1000),
    });
    expect(sub.id).toEqual(expect.any(String));
    expect(sub.updatedAt).toBeInstanceOf(Date);

    const [plan] = mockDb.tables.servicePlan;
    expect(plan).toMatchObject({ code: 'single-dog-monthly', stripePriceId: 'price_monthly_1', price: 55 });
    expect(sub.planId).toBe(plan.id);

    expect(mockDb.tables.payment).toHaveLength(1);
    expect(mockDb.tables.payment[0]).toMatchObject({
      customerId: 'cust_1',
      subscriptionId: sub.id,
      stripeInvoiceId: 'in_123',
      stripePaymentIntentId: 'pi_invoice_123',
      status: 'PAID',
      amount: 55,
      type: 'SUBSCRIPTION',
      paymentMethod: 'STRIPE',
    });

    // The checkout linked the Stripe customer to our Customer
    expect(mockDb.tables.customer[0].stripeCustomerId).toBe('cus_123');
  });

  it('handles invoice.paid arriving before any subscription event', async () => {
    seedCustomer();
    expect((await deliver(makeEvent('invoice.paid', invoice()))).status).toBe(200);
    expect(mockDb.tables.subscription).toHaveLength(1);
    expect(mockDb.tables.payment[0].subscriptionId).toBe(mockDb.tables.subscription[0].id);
  });

  it('replaying the same event id changes nothing', async () => {
    seedCustomer({ stripeCustomerId: 'cus_123' });
    const event = makeEvent('invoice.paid', invoice());
    expect((await deliver(event)).status).toBe(200);
    const before = JSON.stringify(mockDb.tables);

    const replay = await deliver(event);
    expect(replay.status).toBe(200);
    expect(await replay.json()).toMatchObject({ duplicate: true });
    expect(JSON.stringify(mockDb.tables)).toBe(before);
  });

  it('a failed attempt then a paid retry for the same invoice keep one Payment row', async () => {
    seedCustomer({ stripeCustomerId: 'cus_123' });
    await deliver(makeEvent('invoice.payment_failed', invoice({ billing_reason: 'subscription_cycle', amount_paid: 0, attempt_count: 1 })));
    expect(mockDb.tables.payment).toHaveLength(1);
    expect(mockDb.tables.payment[0]).toMatchObject({ status: 'FAILED', amount: 55, type: 'SUBSCRIPTION_RENEWAL' });

    await deliver(makeEvent('invoice.paid', invoice({ billing_reason: 'subscription_cycle' })));
    expect(mockDb.tables.payment).toHaveLength(1);
    expect(mockDb.tables.payment[0]).toMatchObject({ status: 'PAID', amount: 55 });

    // A late failure event never downgrades a paid invoice
    await deliver(makeEvent('invoice.payment_failed', invoice({ billing_reason: 'subscription_cycle' })));
    expect(mockDb.tables.payment[0].status).toBe('PAID');
  });

  it('maps past_due and deleted subscriptions to valid statuses', async () => {
    seedCustomer({ stripeCustomerId: 'cus_123' });
    mockStripeObjects.subscriptions.set('sub_123', stripeSubscription({ status: 'past_due' }));
    await deliver(makeEvent('customer.subscription.updated', stripeSubscription({ status: 'past_due' })));
    expect(mockDb.tables.subscription[0].status).toBe('SUSPENDED');

    const ended = PERIOD_START + 10 * 86400;
    mockStripeObjects.subscriptions.set('sub_123', stripeSubscription({ status: 'canceled', ended_at: ended, canceled_at: ended }));
    await deliver(makeEvent('customer.subscription.deleted', stripeSubscription({ status: 'canceled' })));
    expect(mockDb.tables.subscription).toHaveLength(1);
    expect(mockDb.tables.subscription[0]).toMatchObject({
      status: 'CANCELLED',
      endDate: new Date(ended * 1000),
      nextBillingDate: null,
    });
  });

  it('persists the latest Stripe state even when an older event arrives last', async () => {
    seedCustomer({ stripeCustomerId: 'cus_123' });
    mockStripeObjects.subscriptions.set('sub_123', stripeSubscription({ status: 'canceled', ended_at: PERIOD_END }));
    await deliver(makeEvent('customer.subscription.created', stripeSubscription({ status: 'active' })));
    expect(mockDb.tables.subscription[0].status).toBe('CANCELLED');
  });
});

describe('Stripe webhook: one-time purchases', () => {
  it('records one Payment for a one-time checkout and its payment_intent event', async () => {
    seedCustomer();
    const session = checkoutSession({
      mode: 'payment',
      subscription: null,
      customer: null,
      payment_intent: 'pi_once_1',
      amount_total: 7500,
      metadata: { planId: 'one-time-single-dog' },
    });
    expect((await deliver(makeEvent('checkout.session.completed', session))).status).toBe(200);
    expect((await deliver(makeEvent('payment_intent.succeeded', {
      id: 'pi_once_1', object: 'payment_intent', amount: 7500, amount_received: 7500,
      customer: null, invoice: null, metadata: { type: 'ONE_TIME_PAYMENT' },
    }))).status).toBe(200);

    expect(mockDb.tables.payment).toHaveLength(1);
    expect(mockDb.tables.payment[0]).toMatchObject({
      customerId: 'cust_1', stripePaymentIntentId: 'pi_once_1', status: 'PAID', amount: 75, type: 'ONE_TIME_PAYMENT',
    });
  });

  it('records signup cleanup-fee payment intents and ignores untagged ones', async () => {
    seedCustomer({ stripeCustomerId: 'cus_123' });
    await deliver(makeEvent('payment_intent.succeeded', {
      id: 'pi_setup', amount: 3000, amount_received: 3000, customer: 'cus_123', invoice: null,
      metadata: { type: 'SETUP_FEE', customerId: 'cust_1' },
    }));
    await deliver(makeEvent('payment_intent.succeeded', {
      id: 'pi_admin', amount: 1000, customer: 'cus_123', invoice: null, metadata: {},
    }));
    await deliver(makeEvent('payment_intent.succeeded', {
      id: 'pi_invoice', amount: 5500, customer: 'cus_123', invoice: 'in_9', metadata: { type: 'ONE_TIME' },
    }));
    expect(mockDb.tables.payment).toHaveLength(1);
    expect(mockDb.tables.payment[0]).toMatchObject({ stripePaymentIntentId: 'pi_setup', type: 'INITIAL_CLEANUP', amount: 30 });
  });
});

describe('Stripe webhook: failures make Stripe retry', () => {
  it('returns 500 on a DB error and does not mark the event processed, so the retry succeeds', async () => {
    seedCustomer({ stripeCustomerId: 'cus_123' });
    const event = makeEvent('invoice.paid', invoice());

    mockDb.failOn = 'payment.create';
    const failed = await deliver(event);
    expect(failed.status).toBe(500);
    expect(mockDb.tables.stripeEvent).toHaveLength(0);
    expect(mockDb.tables.payment).toHaveLength(0);
    expect(mockDb.tables.subscription).toHaveLength(0); // rolled back with the event

    mockDb.failOn = null;
    const retried = await deliver(event);
    expect(retried.status).toBe(200);
    expect(mockDb.tables.payment).toHaveLength(1);
    expect(mockDb.tables.stripeEvent.map((e) => e.id)).toEqual([event.id]);
  });

  it('returns 500 when no Customer matches, instead of acknowledging and dropping the payment', async () => {
    mockStripeObjects.customers.set('cus_123', { id: 'cus_123', email: 'stranger@example.com' });
    const res = await deliver(makeEvent('invoice.paid', invoice({ customer_email: 'stranger@example.com' })));
    expect(res.status).toBe(500);
    expect(mockDb.tables.payment).toHaveLength(0);
    expect(mockDb.tables.stripeEvent).toHaveLength(0);
  });

  it('returns 500 for a subscription whose price is not in the catalog', async () => {
    seedCustomer({ stripeCustomerId: 'cus_123' });
    const unknown = stripeSubscription({ items: { data: [{ price: { id: 'price_unknown', unit_amount: 999 } }] } });
    mockStripeObjects.subscriptions.set('sub_123', unknown);
    const res = await deliver(makeEvent('customer.subscription.created', unknown));
    expect(res.status).toBe(500);
    expect(mockDb.tables.subscription).toHaveLength(0);
  });

  it('returns 500 when the webhook secret is not configured', async () => {
    const saved = process.env.STRIPE_WEBHOOK_SECRET;
    const payload = JSON.stringify(makeEvent('invoice.paid', invoice()));
    const signature = realStripe.webhooks.generateTestHeaderString({ payload, secret: saved });
    delete process.env.STRIPE_WEBHOOK_SECRET;
    try {
      const res = await POST(new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST', body: payload, headers: { 'stripe-signature': signature },
      }));
      expect(res.status).toBe(500);
    } finally {
      process.env.STRIPE_WEBHOOK_SECRET = saved;
    }
  });
});
