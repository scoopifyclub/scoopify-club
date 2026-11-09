/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

process.env.JWT_SECRET = 'payments-routes-test-secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
process.env.STRIPE_MONTHLY_1_DOG_PRICE_ID = 'price_monthly_1';
process.env.STRIPE_ONETIME_1_DOG_PRICE_ID = 'price_onetime_1';
delete process.env.STRIPE_INITIAL_CLEANUP_PRICE_ID;

jest.mock('@/lib/prisma', () => {
  const prisma = {
    user: { findUnique: jest.fn(), create: jest.fn() },
    customer: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
    coverageArea: { findMany: jest.fn() },
    subscription: { findFirst: jest.fn() },
    payment: { findUnique: jest.fn(), update: jest.fn() },
    service: { update: jest.fn() },
    $transaction: jest.fn(async (fn) => fn(prisma)),
  };
  return { __esModule: true, prisma, default: prisma };
});

jest.mock('@/lib/stripe', () => ({
  __esModule: true,
  stripe: {
    refunds: { create: jest.fn() },
    checkout: { sessions: { create: jest.fn() } },
    customers: { create: jest.fn() },
    paymentIntents: { create: jest.fn() },
    subscriptions: { create: jest.fn() },
    prices: { retrieve: jest.fn() },
  },
}));

jest.mock('@/lib/admin-auth', () => ({
  requireAdmin: jest.fn(async () => ({ ok: true, user: { id: 'admin_1', email: 'owner@scoopify.club' } })),
}));
jest.mock('@/lib/auth-rate-limit', () => ({ rateLimit: jest.fn(async () => ({ success: true })) }));
jest.mock('@/lib/payment-audit', () => ({ logPaymentEvent: jest.fn() }));
jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() } }));

const mockCookieJar = new Map();
jest.mock('next/headers', () => ({
  headers: async () => new Headers(),
  cookies: async () => ({
    get: (name) => (mockCookieJar.has(name) ? { name, value: mockCookieJar.get(name).value } : undefined),
    set: (nameOrOptions, value, options) => {
      const opts = typeof nameOrOptions === 'object' ? nameOrOptions : { name: nameOrOptions, value, ...options };
      mockCookieJar.set(opts.name, opts);
    },
  }),
}));

const { prisma } = require('@/lib/prisma');
const { stripe } = require('@/lib/stripe');
const { createUserToken } = require('@/lib/jwt-utils');
const adminRefundRoute = require('@/app/api/admin/payments/[paymentId]/refund/route');
const checkoutRoute = require('@/app/api/create-checkout-session/route');
const signupRoute = require('@/app/api/auth/signup/route');

let ip = 0;
function request(path, { body, token } = {}) {
  const headers = new Headers({ 'content-type': 'application/json', 'x-forwarded-for': `10.1.0.${++ip}`, origin: 'http://localhost:3000' });
  if (token) headers.set('cookie', `accessToken=${token}`);
  return new NextRequest(`http://localhost:3000${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCookieJar.clear();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('admin refund route', () => {
  const paidPayment = (overrides = {}) => ({
    id: 'pay_1', status: 'PAID', amount: 55, stripePaymentIntentId: 'pi_1', refundStatus: null, service: { id: 'svc_1' }, ...overrides,
  });
  const refund = (body = { reason: 'DUPLICATE' }) => adminRefundRoute.POST(
    request('/api/admin/payments/pay_1/refund', { body }),
    { params: Promise.resolve({ paymentId: 'pay_1' }) },
  );

  it('refunds through Stripe with an idempotency key and records the refund', async () => {
    prisma.payment.findUnique.mockResolvedValue(paidPayment());
    stripe.refunds.create.mockResolvedValue({ id: 're_1', status: 'succeeded', amount: 5500 });
    prisma.payment.update.mockImplementation(async ({ data }) => ({ id: 'pay_1', status: 'PAID', ...data }));

    const res = await refund();
    expect(res.status).toBe(200);
    expect(stripe.refunds.create).toHaveBeenCalledWith(
      { payment_intent: 'pi_1', reason: 'duplicate', metadata: { paymentId: 'pay_1', refundedBy: 'admin_1', reason: 'DUPLICATE' } },
      { idempotencyKey: 'admin-refund-pay_1' },
    );
    const { data } = prisma.payment.update.mock.calls[0][0];
    expect(data).toMatchObject({
      refundStatus: 'COMPLETED', refundedAmount: 55, refundedBy: 'admin_1', refundReason: 'DUPLICATE', refundTransactionId: 're_1',
    });
    // The Payment stays PAID: REFUNDED is not a PaymentStatus value
    expect(data).not.toHaveProperty('status');
    expect(prisma.service.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'svc_1' }, data: expect.objectContaining({ paymentStatus: 'REFUNDED' }),
    }));
  });

  it('records a pending Stripe refund as PENDING', async () => {
    prisma.payment.findUnique.mockResolvedValue(paidPayment());
    stripe.refunds.create.mockResolvedValue({ id: 're_1', status: 'pending', amount: 5500 });
    prisma.payment.update.mockImplementation(async ({ data }) => data);
    await refund();
    expect(prisma.payment.update.mock.calls[0][0].data.refundStatus).toBe('PENDING');
  });

  it.each([
    ['already refunded', paidPayment({ refundStatus: 'COMPLETED' }), 409],
    ['refund in flight', paidPayment({ refundStatus: 'PENDING' }), 409],
    ['not a Stripe payment', paidPayment({ stripePaymentIntentId: null }), 400],
    ['not paid', paidPayment({ status: 'PENDING' }), 400],
    ['missing', null, 404],
  ])('refuses when the payment is %s, without calling Stripe', async (_label, payment, status) => {
    prisma.payment.findUnique.mockResolvedValue(payment);
    expect((await refund()).status).toBe(status);
    expect(stripe.refunds.create).not.toHaveBeenCalled();
    expect(prisma.payment.update).not.toHaveBeenCalled();
  });

  it('marks the refund FAILED and returns 502 when Stripe rejects it', async () => {
    prisma.payment.findUnique.mockResolvedValue(paidPayment());
    stripe.refunds.create.mockRejectedValue(Object.assign(new Error('Charge already refunded'), { type: 'StripeInvalidRequestError' }));
    const res = await refund();
    expect(res.status).toBe(502);
    expect(prisma.payment.update.mock.calls[0][0].data).toMatchObject({ refundStatus: 'FAILED' });
    expect(prisma.service.update).not.toHaveBeenCalled();
  });
});

describe('create-checkout-session for signup', () => {
  let token;
  beforeEach(async () => {
    token = await createUserToken({ id: 'user_1', email: 'jane@example.com', role: 'CUSTOMER' });
    prisma.customer.findUnique.mockResolvedValue({ id: 'cust_1', stripeCustomerId: 'cus_1' });
    prisma.subscription.findFirst.mockResolvedValue(null);
    stripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_1', url: 'https://checkout.stripe.com/c/pay/cs_1' });
  });
  const signupBody = (overrides = {}) => ({
    planId: 'single-dog-monthly',
    includeInitialCleanup: true,
    startDate: '2026-11-16',
    attemptId: '6f1c1f9e-6a43-4c77-9a35-0f1f0e9d3f1a',
    cancelPath: '/signup/payment?plan=single-dog-monthly',
    ...overrides,
  });

  it('adds the cleanup fee, first visit date and an idempotency key for the signed-in customer', async () => {
    const res = await checkoutRoute.POST(request('/api/create-checkout-session', { body: signupBody(), token }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sessionId: 'cs_1', url: 'https://checkout.stripe.com/c/pay/cs_1' });

    const [params, options] = stripe.checkout.sessions.create.mock.calls[0];
    expect(params.mode).toBe('subscription');
    expect(params.customer).toBe('cus_1');
    expect(params.client_reference_id).toBe('cust_1');
    expect(params.line_items).toEqual([
      { price: 'price_monthly_1', quantity: 1 },
      { price_data: { currency: 'usd', product_data: { name: expect.any(String) }, unit_amount: 3000 }, quantity: 1 },
    ]);
    expect(params.metadata).toMatchObject({ planId: 'single-dog-monthly', customerId: 'cust_1', startDate: '2026-11-16' });
    expect(params.cancel_url).toBe('http://localhost:3000/signup/payment?plan=single-dog-monthly');
    expect(options).toEqual({ idempotencyKey: 'checkout-cust_1-single-dog-monthly-6f1c1f9e-6a43-4c77-9a35-0f1f0e9d3f1a' });
  });

  it('uses the configured cleanup price when one is set', async () => {
    process.env.STRIPE_INITIAL_CLEANUP_PRICE_ID = 'price_cleanup';
    try {
      await checkoutRoute.POST(request('/api/create-checkout-session', { body: signupBody(), token }));
      expect(stripe.checkout.sessions.create.mock.calls[0][0].line_items[1]).toEqual({ price: 'price_cleanup', quantity: 1 });
    } finally {
      delete process.env.STRIPE_INITIAL_CLEANUP_PRICE_ID;
    }
  });

  it('refuses a second subscription for a customer who already has one', async () => {
    prisma.subscription.findFirst.mockResolvedValue({ id: 'sub_row_1' });
    const res = await checkoutRoute.POST(request('/api/create-checkout-session', { body: signupBody(), token }));
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ code: 'already_subscribed' });
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('ignores signup extras from anonymous buyers and unsafe cancel paths', async () => {
    await checkoutRoute.POST(request('/api/create-checkout-session', {
      body: signupBody({ cancelPath: 'https://evil.example/phish', attemptId: 'bad id!' }),
    }));
    const [params, options] = stripe.checkout.sessions.create.mock.calls[0];
    expect(params.line_items).toEqual([{ price: 'price_monthly_1', quantity: 1 }]);
    expect(params.metadata.startDate).toBe('');
    expect(params.cancel_url).toBe('http://localhost:3000/pricing');
    expect(options).toBeUndefined();
  });

  it('never adds the cleanup fee to one-time plans', async () => {
    await checkoutRoute.POST(request('/api/create-checkout-session', { body: signupBody({ planId: 'one-time-single-dog' }), token }));
    const [params] = stripe.checkout.sessions.create.mock.calls[0];
    expect(params.mode).toBe('payment');
    expect(params.line_items).toEqual([{ price: 'price_onetime_1', quantity: 1 }]);
    expect(prisma.subscription.findFirst).not.toHaveBeenCalled();
  });
});

describe('customer signup', () => {
  const body = (overrides = {}) => ({
    email: 'new@example.com',
    firstName: 'New',
    lastName: 'Customer',
    password: 'Sup3r$ecurePass!',
    deviceFingerprint: 'fp_1',
    phone: '5551234567',
    address: { street: '1 Main St', city: 'Peyton', state: 'CO', zipCode: '80831' },
    serviceType: 'weekly-1',
    serviceDay: 'monday',
    startDate: '2026-11-16',
    ...overrides,
  });

  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.coverageArea.findMany.mockResolvedValue([{ id: 'ca_1', zipCode: '80831', employeeId: 'emp_1', travelDistance: 20 }]);
    prisma.user.create.mockImplementation(async ({ data }) => data);
    prisma.customer.create.mockImplementation(async ({ data }) => ({ ...data, address: null }));
    stripe.customers.create.mockResolvedValue({ id: 'cus_new' });
  });

  it('creates the account without charging and sends the customer to the payment step', async () => {
    const res = await signupRoute.POST(request('/api/auth/signup', { body: body() }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.next).toBe('/signup/payment?plan=single-dog-monthly&start=2026-11-16&day=monday');

    expect(stripe.paymentIntents.create).not.toHaveBeenCalled();
    expect(stripe.subscriptions.create).not.toHaveBeenCalled();
    const [params, options] = stripe.customers.create.mock.calls[0];
    expect(params).not.toHaveProperty('payment_method');
    expect(options.idempotencyKey).toMatch(/^signup-customer-[0-9a-f]{40}$/);
    expect(prisma.customer.create.mock.calls[0][0].data.stripeCustomerId).toBe('cus_new');

    // Signed in for checkout, which reads accessToken
    expect(mockCookieJar.get('accessToken')).toMatchObject({ httpOnly: true, sameSite: 'lax', value: json.token });
  });

  it('a double-submitted signup reuses the same Stripe customer idempotency key', async () => {
    await signupRoute.POST(request('/api/auth/signup', { body: body() }));
    await signupRoute.POST(request('/api/auth/signup', { body: body() }));
    await signupRoute.POST(request('/api/auth/signup', { body: body({ email: 'other@example.com' }) }));
    const keys = stripe.customers.create.mock.calls.map(([, options]) => options.idempotencyKey);
    expect(keys[0]).toBe(keys[1]);
    expect(keys[2]).not.toBe(keys[0]);
  });

  it('returns 409 when a concurrent submit already created the user', async () => {
    prisma.user.create.mockRejectedValue(Object.assign(new Error('Unique constraint failed on email'), { code: 'P2002' }));
    const res = await signupRoute.POST(request('/api/auth/signup', { body: body() }));
    expect(res.status).toBe(409);
  });

  it('rejects an unavailable plan before creating anything in Stripe', async () => {
    const res = await signupRoute.POST(request('/api/auth/signup', { body: body({ serviceType: 'weekly-3' }) }));
    expect(res.status).toBe(400);
    expect(stripe.customers.create).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});
