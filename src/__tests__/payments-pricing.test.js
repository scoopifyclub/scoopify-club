/**
 * @jest-environment node
 */
import fs from 'fs';
import path from 'path';
import { renderToStaticMarkup } from 'react-dom/server';

const PRICE_ENV = {
  STRIPE_MONTHLY_1_DOG_PRICE_ID: 'price_m1',
  STRIPE_MONTHLY_2_DOGS_PRICE_ID: 'price_m2',
  STRIPE_MONTHLY_3_PLUS_DOGS_PRICE_ID: 'price_m3',
};
Object.assign(process.env, PRICE_ENV);
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';

const mockStripe = {
  prices: { retrieve: jest.fn() },
  checkout: { sessions: { create: jest.fn() } },
};
jest.mock('@/lib/stripe', () => ({ __esModule: true, stripe: mockStripe }));
jest.mock('@/lib/auth-rate-limit', () => ({ rateLimit: jest.fn(async () => ({ success: true })) }));
jest.mock('@/lib/prisma', () => {
  const prisma = { customer: { findUnique: jest.fn(async () => null) } };
  return { __esModule: true, prisma, default: prisma };
});

const catalog = require('@/lib/pricing-catalog');
const { getPricingPlans, resolvePurchasablePlan } = require('@/lib/pricing.server');

const STRIPE_PRICES = {
  price_m1: { id: 'price_m1', active: true, currency: 'usd', type: 'recurring', recurring: { interval: 'month' }, unit_amount: 7900 },
  price_m2: { id: 'price_m2', active: true, currency: 'usd', type: 'recurring', recurring: { interval: 'month' }, unit_amount: 8900 },
  price_m3: { id: 'price_m3', active: true, currency: 'usd', type: 'recurring', recurring: { interval: 'month' }, unit_amount: 9900 },
  price_once: { id: 'price_once', active: true, currency: 'usd', type: 'one_time', unit_amount: 4200 },
};

beforeEach(() => {
  mockStripe.prices.retrieve.mockReset().mockImplementation(async (id) => {
    if (!STRIPE_PRICES[id]) throw new Error(`No such price: ${id}`);
    return STRIPE_PRICES[id];
  });
  mockStripe.checkout.sessions.create.mockReset().mockResolvedValue({ id: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/cs_test_1' });
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('pricing catalog', () => {
  it('has one entry per plan with a unique id and price env var', () => {
    const items = catalog.ALL_CATALOG_ITEMS;
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    expect(new Set(items.map((i) => i.priceEnv)).size).toBe(items.length);
    for (const item of items) expect(item.priceEnv).toMatch(/^STRIPE_[A-Z0-9_]+_PRICE_ID$/);
  });

  it('carries the provisional pilot amounts', () => {
    const amounts = Object.fromEntries(catalog.ALL_CATALOG_ITEMS.map((p) => [p.id, p.displayAmount]));
    expect(amounts).toEqual({
      'single-dog-monthly': 79,
      'two-dogs-monthly': 89,
      'three-plus-dogs-monthly': 99,
      'one-time-single-dog': 79,
      'one-time-two-dogs': 99,
      'one-time-three-plus-dogs': 119,
      'initial-cleanup': 49,
    });
    // One-time cleanups and the catch-up are starting prices; monthly plans are flat
    expect(catalog.ALL_CATALOG_ITEMS.filter((p) => p.startingAt).map((p) => p.id).sort()).toEqual(
      ['initial-cleanup', 'one-time-single-dog', 'one-time-three-plus-dogs', 'one-time-two-dogs'],
    );
    expect(catalog.INITIAL_CLEANUP.fallbackChargeCents).toBe(4900);
    expect(catalog.UPFRONT_POLICY).toBe('FIRST_MONTH_PLUS_CATCH_UP');
  });

  it('sells 1 to 3 dogs online and sends 4+ dogs to a quote request', () => {
    expect(catalog.PLANS.map((p) => p.numberOfDogs)).toEqual([1, 2, 3, 1, 2, 3]);
    expect(catalog.QUOTE_MIN_DOGS).toBe(4);
    expect(catalog.QUOTE_REQUEST_PATH).toBe('/quote');
    expect(catalog.findPlan('quote')).toBeNull();
    expect(catalog.requiresQuote({ dogCount: 4 })).toBe(true);
    expect(catalog.requiresQuote({ dogCount: 2, unusualYard: true })).toBe(true);
    expect(catalog.requiresQuote({ dogCount: 2 })).toBe(false);
    expect(catalog.PILOT_FLOOR_CENTS['single-dog-monthly']).toBe(7900);
  });

  it('resolves the plan names signup and older code send', () => {
    expect(catalog.findPlan('weekly-1').id).toBe('single-dog-monthly');
    expect(catalog.findPlan('weekly-2-dogs').id).toBe('two-dogs-monthly');
    expect(catalog.findPlan('one-time-3').id).toBe('one-time-three-plus-dogs');
    expect(catalog.findPlan('nope')).toBeNull();
  });

  it('reads the canonical env var first and falls back to the legacy .env.example name', () => {
    const plan = catalog.findPlan('single-dog-monthly');
    expect(catalog.getConfiguredPriceId(plan, { STRIPE_SINGLE_DOG_PRICE_ID: 'price_legacy' })).toBe('price_legacy');
    expect(catalog.getConfiguredPriceId(plan, { STRIPE_SINGLE_DOG_PRICE_ID: 'price_legacy', STRIPE_MONTHLY_1_DOG_PRICE_ID: 'price_new' })).toBe('price_new');
    expect(catalog.getConfiguredPriceId(plan, {})).toBeNull();
  });

  it('is the only place price amounts are defined for the pricing page and /api/prices', () => {
    const read = (p) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');
    for (const file of ['src/app/pricing/page.jsx', 'src/app/api/prices/route.js']) {
      expect(read(file)).not.toMatch(/\b(25|35|45|75|90|120)\.00\b/);
      expect(read(file)).not.toMatch(/price:\s*\d/);
    }
  });
});

describe('customer-facing copy', () => {
  it('no longer shows the old amounts or "3+ dogs" plans', () => {
    const read = (p) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');
    for (const file of [
      'src/app/signup/page.jsx',
      'src/app/signup/payment/page.jsx',
      'src/app/dashboard/subscription/page.jsx',
      'src/app/api/flyers/generate/route.js',
    ]) {
      expect(read(file)).not.toMatch(/\$(30|55|70|89|100)\b|3\+ Dogs/);
    }
  });
});

describe('getPricingPlans', () => {
  it('uses the Stripe Price amount and marks configured monthly plans available', async () => {
    const plans = await getPricingPlans({ stripe: mockStripe, env: PRICE_ENV });
    const byId = Object.fromEntries(plans.map((p) => [p.id, p]));
    expect(byId['single-dog-monthly']).toMatchObject({ priceId: 'price_m1', price: 79, available: true, startingAt: false });
    expect(byId['three-plus-dogs-monthly']).toMatchObject({ price: 99, available: true });
    // Shown as a starting price, but not sellable until its Stripe Price ID is set
    expect(byId['one-time-single-dog']).toMatchObject({ priceId: null, price: 79, startingAt: true, available: false });
  });

  it('prefers Stripe over the catalog when they disagree', async () => {
    mockStripe.prices.retrieve.mockResolvedValueOnce({ ...STRIPE_PRICES.price_m1, unit_amount: 6000 });
    const [single] = await getPricingPlans({ stripe: mockStripe, env: PRICE_ENV });
    expect(single.price).toBe(60);
  });

  it('shows a one-time plan only once its Stripe price is configured', async () => {
    const plans = await getPricingPlans({ stripe: mockStripe, env: { ...PRICE_ENV, STRIPE_ONETIME_1_DOG_PRICE_ID: 'price_once' } });
    expect(plans.find((p) => p.id === 'one-time-single-dog')).toMatchObject({ price: 42, available: true });
  });

  it('refuses a price ID of the wrong type (one-time ID on a monthly plan)', async () => {
    const plans = await getPricingPlans({ stripe: mockStripe, env: { ...PRICE_ENV, STRIPE_MONTHLY_1_DOG_PRICE_ID: 'price_once' } });
    expect(plans[0]).toMatchObject({ available: false });
  });

  it('falls back to the agreed amounts without Stripe credentials', async () => {
    const plans = await getPricingPlans({ stripe: null, env: PRICE_ENV });
    expect(plans.filter((p) => p.available).map((p) => p.price)).toEqual([79, 89, 99]);
  });

  it('only allows buying catalog prices', () => {
    expect(resolvePurchasablePlan({ planId: 'weekly-2' }, PRICE_ENV)).toMatchObject({ priceId: 'price_m2' });
    expect(resolvePurchasablePlan({ priceId: 'price_m3' }, PRICE_ENV).item.id).toBe('three-plus-dogs-monthly');
    expect(resolvePurchasablePlan({ priceId: 'price_attacker' }, PRICE_ENV)).toBeNull();
    expect(resolvePurchasablePlan({ planId: 'one-time-single-dog' }, PRICE_ENV)).toBeNull();
  });
});

describe('/pricing page', () => {
  it('renders plans and prices on the server (no client fetch, no "Loading Plans")', async () => {
    const PricingPage = require('@/app/pricing/page').default;
    const html = renderToStaticMarkup(await PricingPage());
    for (const amount of ['$79', '$89', '$99', '$119']) expect(html).toContain(amount);
    expect(html).toMatch(/From<\/span><span class="text-4xl font-bold">\$119/);
    expect(html).not.toContain('3+');
    // 4+ dogs get a quote link, not a checkout button
    expect(html).toContain('4+ dogs?');
    expect(html).toContain('href="/quote"');
    expect(html).not.toContain('Loading Plans');
  });

  it('does not import the server Stripe module into client code', () => {
    const read = (p) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');
    for (const file of ['src/app/pricing/CheckoutButton.jsx', 'src/components/Pricing.jsx', 'src/lib/stripe-client.js']) {
      expect(read(file)).not.toMatch(/from ['"](@\/lib\/stripe|stripe)['"]/);
    }
    expect(read('src/app/pricing/page.jsx')).not.toMatch(/^'use client'/);
  });
});

describe('/api/prices', () => {
  it('returns the catalog resolved against Stripe', async () => {
    const { GET } = require('@/app/api/prices/route');
    const body = await (await GET()).json();
    expect(body.plans.map((p) => p.id)).toEqual(catalog.ALL_CATALOG_ITEMS.map((i) => i.id));
    expect(body.plans[0]).toMatchObject({ priceId: 'price_m1', price: 79, available: true });
  });
});

describe('/api/create-checkout-session', () => {
  const post = (body) => {
    const { POST } = require('@/app/api/create-checkout-session/route');
    const { NextRequest } = require('next/server');
    return POST(new NextRequest('http://localhost/api/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json', origin: 'https://www.scoopify.club' },
    }));
  };

  it('creates a subscription Checkout for a monthly plan id and returns its URL', async () => {
    const res = await post({ planId: 'two-dogs-monthly' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sessionId: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/cs_test_1' });
    const args = mockStripe.checkout.sessions.create.mock.calls[0][0];
    expect(args).toMatchObject({
      mode: 'subscription',
      line_items: [{ price: 'price_m2', quantity: 1 }],
      success_url: 'https://www.scoopify.club/success?session_id={CHECKOUT_SESSION_ID}',
      subscription_data: { metadata: { planId: 'two-dogs-monthly' } },
    });
  });

  it('ignores a client-supplied isOneTime flag', async () => {
    await post({ priceId: 'price_m1', isOneTime: true });
    expect(mockStripe.checkout.sessions.create.mock.calls[0][0].mode).toBe('subscription');
  });

  it('rejects price IDs outside the catalog and unconfigured plans', async () => {
    expect((await post({ priceId: 'price_anything', isOneTime: true })).status).toBe(400);
    expect((await post({ planId: 'one-time-single-dog' })).status).toBe(400);
    expect((await post({})).status).toBe(400);
    expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
  });
});

describe('Content-Security-Policy', () => {
  it('allows Stripe.js, its frames and Google Maps', async () => {
    const { default: nextConfig } = await import('../../next.config.js');
    const headers = (await nextConfig.headers()).flatMap((h) => h.headers);
    const csp = headers.find((h) => h.key === 'Content-Security-Policy').value;
    const directive = (name) => csp.split(';').map((d) => d.trim()).find((d) => d.startsWith(`${name} `)) || '';
    expect(directive('script-src')).toContain('https://js.stripe.com');
    expect(directive('script-src')).toContain('https://maps.googleapis.com');
    expect(directive('frame-src')).toContain('https://js.stripe.com');
    expect(directive('frame-src')).toContain('https://hooks.stripe.com');
    expect(directive('connect-src')).toMatch(/https:(\s|$)|https:\/\/api\.stripe\.com/);
  });
});

describe('Stripe module split', () => {
  it('imports @/lib/stripe without keys instead of throwing', () => {
    const saved = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    try {
      jest.isolateModules(() => {
        jest.unmock('@/lib/stripe');
        const mod = require('@/lib/stripe');
        expect(mod.stripe).toBeNull();
        expect(() => mod.requireStripe()).toThrow(/STRIPE_SECRET_KEY/);
      });
    } finally {
      process.env.STRIPE_SECRET_KEY = saved;
    }
  });
});
