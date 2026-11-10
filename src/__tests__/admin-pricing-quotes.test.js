/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';

process.env.JWT_SECRET = 'admin-pricing-test-secret';
process.env.ADMIN_EMAILS = 'owner@scoopify.club';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
Object.assign(process.env, {
  STRIPE_MONTHLY_1_DOG_PRICE_ID: 'price_m1',
  STRIPE_MONTHLY_2_DOGS_PRICE_ID: 'price_m2',
  STRIPE_MONTHLY_3_PLUS_DOGS_PRICE_ID: 'price_m3',
});

const store = {
  markets: new Map(),
  marketPrices: new Map(),
  promotions: new Map(),
  quotes: new Map(),
  systemLogs: [],
};

function matchWhere(row, where = {}) {
  return Object.entries(where).every(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (value.in) return value.in.includes(row[key]);
      if (value.lte != null) return row[key] <= value.lte;
      if (value.gt != null) return row[key] > value.gt;
      return true;
    }
    return row[key] === value;
  });
}

jest.mock('@/lib/admin-auth', () => ({
  requireAdmin: jest.fn(async () => ({ ok: true, userId: 'admin-1', user: { id: 'admin-1', email: 'owner@scoopify.club' }, role: 'ADMIN' })),
}));

jest.mock('@/lib/auth-rate-limit', () => ({
  rateLimit: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/lib/stripe', () => ({
  __esModule: true,
  stripe: {
    coupons: { create: jest.fn(async ({ name }) => ({ id: `coupon_${name}` })) },
    checkout: { sessions: { create: jest.fn(async () => ({ id: 'cs_quote', url: 'https://checkout.stripe.com/c/pay/cs_quote' })) } },
    prices: { retrieve: jest.fn() },
  },
}));

jest.mock('@/lib/prisma', () => {
  const prisma = {
    market: {
      findMany: jest.fn(async ({ where, include } = {}) => {
        let rows = [...store.markets.values()].filter((m) => matchWhere(m, where));
        if (include?.prices) {
          rows = rows.map((m) => ({
            ...m,
            prices: [...store.marketPrices.values()]
              .filter((p) => p.marketId === m.id)
              .filter((p) => {
                const pw = include.prices.where || {};
                if (pw.effectiveFrom?.lte && p.effectiveFrom > pw.effectiveFrom.lte) return false;
                if (pw.OR) {
                  const open = p.effectiveTo == null;
                  const future = p.effectiveTo && pw.OR.some((clause) => clause.effectiveTo?.gt && p.effectiveTo > clause.effectiveTo.gt);
                  if (!open && !future) return false;
                }
                return true;
              })
              .sort((a, b) => b.effectiveFrom - a.effectiveFrom),
          }));
        }
        return rows;
      }),
      findUnique: jest.fn(async ({ where, include }) => {
        const row = store.markets.get(where.id) || [...store.markets.values()].find((m) => m.slug === where.slug);
        if (!row) return null;
        if (!include?.prices && !include?._count) return { ...row };
        return {
          ...row,
          prices: [...store.marketPrices.values()].filter((p) => p.marketId === row.id),
          _count: { prices: [...store.marketPrices.values()].filter((p) => p.marketId === row.id).length },
        };
      }),
      create: jest.fn(async ({ data, include }) => {
        const row = { ...data, createdAt: new Date(), updatedAt: new Date() };
        store.markets.set(row.id, row);
        return include?.prices ? { ...row, prices: [] } : row;
      }),
      update: jest.fn(async ({ where, data, include }) => {
        const row = { ...store.markets.get(where.id), ...data, updatedAt: new Date() };
        store.markets.set(where.id, row);
        return include?.prices
          ? { ...row, prices: [...store.marketPrices.values()].filter((p) => p.marketId === row.id) }
          : row;
      }),
      delete: jest.fn(async ({ where }) => {
        store.markets.delete(where.id);
        return {};
      }),
    },
    marketPrice: {
      createMany: jest.fn(async ({ data }) => {
        for (const row of data) store.marketPrices.set(row.id, row);
        return { count: data.length };
      }),
      updateMany: jest.fn(async ({ where, data }) => {
        let count = 0;
        for (const [id, row] of store.marketPrices) {
          if (row.marketId !== where.marketId) continue;
          if (where.planCode?.in && !where.planCode.in.includes(row.planCode)) continue;
          if (where.effectiveTo !== undefined && where.effectiveTo !== null && row.effectiveTo !== where.effectiveTo) continue;
          if (where.effectiveTo === null && row.effectiveTo != null) continue;
          store.marketPrices.set(id, { ...row, ...data });
          count += 1;
        }
        return { count };
      }),
    },
    promotion: {
      findMany: jest.fn(async ({ where } = {}) => [...store.promotions.values()].filter((p) => matchWhere(p, where))),
      findUnique: jest.fn(async ({ where }) => {
        if (where.id) return store.promotions.get(where.id) || null;
        return [...store.promotions.values()].find((p) => p.code === where.code) || null;
      }),
      create: jest.fn(async ({ data }) => {
        const row = { ...data, redemptionCount: 0, createdAt: new Date(), updatedAt: new Date() };
        store.promotions.set(row.id, row);
        return row;
      }),
      update: jest.fn(async ({ where, data }) => {
        const row = { ...store.promotions.get(where.id), ...data, updatedAt: new Date() };
        store.promotions.set(where.id, row);
        return row;
      }),
    },
    quote: {
      findMany: jest.fn(async ({ where } = {}) => [...store.quotes.values()].filter((q) => matchWhere(q, where))),
      findUnique: jest.fn(async ({ where }) => store.quotes.get(where.id) || null),
      create: jest.fn(async ({ data }) => {
        const row = { ...data };
        store.quotes.set(row.id, row);
        return row;
      }),
      update: jest.fn(async ({ where, data }) => {
        const row = { ...store.quotes.get(where.id), ...data };
        store.quotes.set(where.id, row);
        return row;
      }),
    },
    systemLog: {
      create: jest.fn(async ({ data }) => {
        store.systemLogs.push(data);
        return data;
      }),
    },
    customer: { findUnique: jest.fn(async () => null) },
    subscription: { findFirst: jest.fn(async () => null) },
    $transaction: jest.fn(async (fn) => fn(prisma)),
  };
  return { __esModule: true, prisma, default: prisma };
});

const { requireAdmin } = require('@/lib/admin-auth');
const { prisma } = require('@/lib/prisma');
const { stripe } = require('@/lib/stripe');
const {
  validateOverrideAmount,
  estimateRetainedCents,
  isProfitableAmount,
  resolveMarketPlanPrice,
} = require('@/lib/pricing-markets');
const { validatePromotionInput, applyPromotion, isPromotionActive } = require('@/lib/pricing-promotions');
const {
  validateQuoteRequest,
  resolveApprovedQuoteForCheckout,
  approveQuote,
  createQuoteRequest,
} = require('@/lib/pricing-quotes');
const { QUOTE_STATUSES, findPlan } = require('@/lib/pricing-catalog');

const marketsRoute = require('@/app/api/admin/pricing/markets/route');
const marketPricesRoute = require('@/app/api/admin/pricing/markets/[id]/prices/route');
const promotionsRoute = require('@/app/api/admin/pricing/promotions/route');
const adminQuotesRoute = require('@/app/api/admin/quotes/route');
const adminQuoteIdRoute = require('@/app/api/admin/quotes/[id]/route');
const publicQuotesRoute = require('@/app/api/quotes/route');
const checkoutRoute = require('@/app/api/create-checkout-session/route');

const BASE = 'http://localhost:3000';

function req(path, { method = 'GET', body } = {}) {
  return new NextRequest(`${BASE}${path}`, {
    method,
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.8', origin: BASE },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

beforeEach(() => {
  store.markets.clear();
  store.marketPrices.clear();
  store.promotions.clear();
  store.quotes.clear();
  store.systemLogs.length = 0;
  requireAdmin.mockResolvedValue({ ok: true, userId: 'admin-1', user: { id: 'admin-1' }, role: 'ADMIN' });
  jest.clearAllMocks();
});

describe('profitability and pilot floors', () => {
  it('keeps pilot amounts profitable after the 75% scooper share', () => {
    expect(isProfitableAmount(7900, { kind: 'ONE_TIME' })).toBe(true);
    expect(estimateRetainedCents(7900, { kind: 'ONE_TIME' })).toBeGreaterThan(0);
    expect(isProfitableAmount(100, { kind: 'ONE_TIME' })).toBe(false);
  });

  it('rejects amounts below the pilot floor unless overridden', () => {
    const blocked = validateOverrideAmount('single-dog-monthly', 5000, { kind: 'SUBSCRIPTION' });
    expect(blocked.ok).toBe(false);
    expect(blocked.belowFloor).toBe(true);

    const allowed = validateOverrideAmount('single-dog-monthly', 5000, {
      kind: 'SUBSCRIPTION',
      allowBelowFloor: true,
      allowUnprofitable: false,
    });
    // $50/mo is still profitable on a weekly allocation, so only the floor mattered
    expect(allowed.ok).toBe(true);
  });

  it('never auto-accepts an unprofitable override', () => {
    const result = validateOverrideAmount('one-time-single-dog', 50, { kind: 'ONE_TIME' });
    expect(result.ok).toBe(false);
    expect(result.unprofitable || result.belowFloor).toBe(true);
  });
});

describe('promotions', () => {
  it('validates and applies percent / free-catchup promos', () => {
    const percent = validatePromotionInput({ code: 'save10', type: 'PERCENT', amount: 10, name: 'Save 10' });
    expect(percent.ok).toBe(true);
    expect(applyPromotion({ ...percent.value, id: 'p1', active: true }, { amountCents: 8900 }).discountCents).toBe(890);

    const catchup = validatePromotionInput({ code: 'freecatch', type: 'FREE_CATCHUP', amount: 0, name: 'Free catch-up' });
    expect(applyPromotion({ ...catchup.value, id: 'p2', active: true }, { amountCents: 8900 }).waiveCatchUp).toBe(true);
    expect(isPromotionActive({ active: false, code: 'X' })).toBe(false);
  });
});

describe('quotes', () => {
  it('requires unusual criteria for catalog-sized yards', () => {
    expect(validateQuoteRequest({ contactEmail: 'a@b.com', dogCount: 2 }).ok).toBe(false);
    expect(validateQuoteRequest({ contactEmail: 'a@b.com', dogCount: 4 }).ok).toBe(true);
    expect(validateQuoteRequest({ contactEmail: 'a@b.com', dogCount: 2, unusualYard: true }).ok).toBe(true);
  });

  it('blocks checkout until an admin approves an amount', () => {
    const pending = { id: 'q1', status: QUOTE_STATUSES.PENDING_ADMIN, proposedAmountCents: null, dogCount: 4, kind: 'ONE_TIME' };
    expect(resolveApprovedQuoteForCheckout(pending).code).toBe('quote_not_approved');

    const approved = {
      id: 'q1',
      status: QUOTE_STATUSES.APPROVED,
      proposedAmountCents: 14900,
      dogCount: 4,
      kind: 'ONE_TIME',
      expiresAt: new Date(Date.now() + 86400000),
    };
    const resolved = resolveApprovedQuoteForCheckout(approved);
    expect(resolved.ok).toBe(true);
    expect(resolved.lineItem.price_data.unit_amount).toBe(14900);
  });

  it('refuses to approve an unprofitable quote without an explicit override', async () => {
    const quoteId = randomUUID();
    store.quotes.set(quoteId, {
      id: quoteId,
      status: QUOTE_STATUSES.PENDING_ADMIN,
      kind: 'ONE_TIME',
      dogCount: 5,
      planCode: null,
      contactEmail: 'yard@example.com',
    });

    const blocked = await approveQuote(quoteId, { amountCents: 100, adminUserId: 'admin-1', db: prisma });
    expect(blocked.ok).toBe(false);

    const forced = await approveQuote(quoteId, {
      amountCents: 100,
      allowBelowFloor: true,
      allowUnprofitable: true,
      adminUserId: 'admin-1',
      db: prisma,
    });
    expect(forced.ok).toBe(true);
    expect(forced.quote.status).toBe(QUOTE_STATUSES.APPROVED);
  });
});

describe('admin APIs requireAdmin', () => {
  it('returns the requireAdmin response when the caller is not an admin', async () => {
    const denied = { ok: false, response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }) };
    requireAdmin.mockResolvedValueOnce(denied);
    const res = await marketsRoute.GET(req('/api/admin/pricing/markets'));
    expect(res.status).toBe(403);

    requireAdmin.mockResolvedValueOnce(denied);
    const promoRes = await promotionsRoute.GET(req('/api/admin/pricing/promotions'));
    expect(promoRes.status).toBe(403);

    requireAdmin.mockResolvedValueOnce(denied);
    const quoteRes = await adminQuotesRoute.GET(req('/api/admin/quotes'));
    expect(quoteRes.status).toBe(403);
  });

  it('creates a market and publishes pilot prices', async () => {
    const created = await marketsRoute.POST(req('/api/admin/pricing/markets', {
      method: 'POST',
      body: { name: 'Peyton / Falcon', zipCodes: ['80831', '80808'], notes: 'Pilot' },
    }));
    expect(created.status).toBe(201);
    const { market } = await created.json();
    expect(market.slug).toBe('peyton-falcon');
    expect(market.zipCodes).toEqual(['80831', '80808']);

    const priced = await marketPricesRoute.PUT(req(`/api/admin/pricing/markets/${market.id}/prices`, {
      method: 'PUT',
      body: {
        replace: true,
        prices: [
          { planCode: 'single-dog-monthly', amountCents: 7900 },
          { planCode: 'two-dogs-monthly', amountCents: 8900 },
        ],
      },
    }), { params: Promise.resolve({ id: market.id }) });
    expect(priced.status).toBe(200);
    const body = await priced.json();
    expect(body.market.prices.some((p) => p.planCode === 'single-dog-monthly' && p.amountCents === 7900)).toBe(true);

    const resolved = resolveMarketPlanPrice(findPlan('single-dog-monthly'), body.market);
    expect(resolved).toMatchObject({ source: 'market', amountCents: 7900, stripePriceId: 'price_m1' });
  });

  it('creates promotions and lists pending quotes', async () => {
    const promo = await promotionsRoute.POST(req('/api/admin/pricing/promotions', {
      method: 'POST',
      body: { code: 'pilot10', name: 'Pilot 10%', type: 'PERCENT', amount: 10 },
    }));
    expect(promo.status).toBe(201);

    const quote = await createQuoteRequest({
      contactEmail: 'bigyard@example.com',
      dogCount: 5,
      zipCode: '80831',
      unusualYard: true,
      kind: 'ONE_TIME',
    }, { db: prisma });
    expect(quote.ok).toBe(true);

    const listed = await adminQuotesRoute.GET(req('/api/admin/quotes?status=PENDING_ADMIN'));
    const listBody = await listed.json();
    expect(listBody.quotes).toHaveLength(1);

    const approved = await adminQuoteIdRoute.PATCH(req(`/api/admin/quotes/${quote.quote.id}`, {
      method: 'PATCH',
      body: { action: 'approve', amountCents: 14900 },
    }), { params: Promise.resolve({ id: quote.quote.id }) });
    expect(approved.status).toBe(200);
    expect((await approved.json()).quote.status).toBe(QUOTE_STATUSES.APPROVED);
  });
});

describe('public quote + checkout', () => {
  it('accepts a public quote request without charging', async () => {
    const res = await publicQuotesRoute.POST(req('/api/quotes', {
      method: 'POST',
      body: {
        contactName: 'Sam',
        contactEmail: 'sam@example.com',
        dogCount: 4,
        zipCode: '80831',
        unusualYard: true,
      },
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.quoteId).toBeTruthy();
    expect(body.status).toBe(QUOTE_STATUSES.PENDING_ADMIN);
  });

  it('creates Checkout only for an approved quote and ignores client amounts', async () => {
    const quoteId = randomUUID();
    store.quotes.set(quoteId, {
      id: quoteId,
      status: QUOTE_STATUSES.APPROVED,
      proposedAmountCents: 15900,
      dogCount: 4,
      kind: 'ONE_TIME',
      contactEmail: 'sam@example.com',
      expiresAt: new Date(Date.now() + 86400000),
      planCode: null,
      stripePriceId: null,
    });

    const pending = await checkoutRoute.POST(req('/api/create-checkout-session', {
      method: 'POST',
      body: { quoteId, amountCents: 1 },
    }));
    // Still approved — client amount is ignored; server uses proposedAmountCents
    expect(pending.status).toBe(200);
    const args = stripe.checkout.sessions.create.mock.calls[0][0];
    expect(args.line_items[0].price_data.unit_amount).toBe(15900);
    expect(args.metadata.quoteId).toBe(quoteId);
    expect(args.mode).toBe('payment');
  });

  it('rejects checkout for a pending quote', async () => {
    const quoteId = randomUUID();
    store.quotes.set(quoteId, {
      id: quoteId,
      status: QUOTE_STATUSES.PENDING_ADMIN,
      proposedAmountCents: null,
      dogCount: 4,
      kind: 'ONE_TIME',
      contactEmail: 'sam@example.com',
    });
    const res = await checkoutRoute.POST(req('/api/create-checkout-session', {
      method: 'POST',
      body: { quoteId },
    }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: 'quote_not_approved' });
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });
});

describe('privileged route source files call requireAdmin', () => {
  const fs = require('fs');
  const path = require('path');
  const root = path.join(process.cwd(), 'src/app/api/admin');
  const files = [
    'pricing/markets/route.js',
    'pricing/markets/[id]/route.js',
    'pricing/markets/[id]/prices/route.js',
    'pricing/promotions/route.js',
    'pricing/promotions/[id]/route.js',
    'quotes/route.js',
    'quotes/[id]/route.js',
  ];

  it.each(files)('%s imports and awaits requireAdmin', (rel) => {
    const src = fs.readFileSync(path.join(root, rel), 'utf8');
    expect(src).toMatch(/requireAdmin/);
    expect(src).toMatch(/if \(!auth\.ok\) return auth\.response/);
  });
});
