import { findPlan, getConfiguredPriceId, pilotFloorCents } from '@/lib/pricing-catalog';
import { SCOOPER_SHARE, STRIPE_FEE_FIXED_CENTS, STRIPE_FEE_RATE, pricingBasisFor } from '@/lib/job-financials';

/** Normalize a ZIP to a 5-digit US form, or null. */
export function normalizeZip(zip) {
  if (zip == null) return null;
  const digits = String(zip).replace(/\D/g, '');
  if (digits.length < 5) return null;
  return digits.slice(0, 5);
}

export function slugifyMarketName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

/**
 * Estimated retained contribution (cents) for a charge amount after scooper
 * share and Stripe fees. Used as the profitability gate for quotes / overrides.
 */
export function estimateRetainedCents(amountCents, { kind = 'ONE_TIME' } = {}) {
  const chargeCents = Number(amountCents);
  if (!Number.isFinite(chargeCents) || chargeCents <= 0) return null;
  const basis = pricingBasisFor({ type: kind === 'SUBSCRIPTION' ? 'SUBSCRIPTION' : 'ONE_TIME' });
  const share = basis === 'ONE_TIME' ? 1 : 12 / 52;
  const customerPriceCents = Math.round(chargeCents * share);
  const scooperEarningCents = Math.round(customerPriceCents * SCOOPER_SHARE);
  const stripeFeeCents = Math.round((chargeCents * STRIPE_FEE_RATE + STRIPE_FEE_FIXED_CENTS) * share);
  return customerPriceCents - scooperEarningCents - stripeFeeCents;
}

export function isProfitableAmount(amountCents, { kind = 'ONE_TIME' } = {}) {
  const retained = estimateRetainedCents(amountCents, { kind });
  return retained != null && retained > 0;
}

/**
 * Validates a proposed market/quote amount against the pilot floor and
 * profitability. Returns { ok, error, belowFloor, unprofitable, floorCents, retainedCents }.
 * Setting allowBelowFloor / allowUnprofitable lets an admin override intentionally.
 */
export function validateOverrideAmount(planCode, amountCents, {
  kind = 'ONE_TIME',
  allowBelowFloor = false,
  allowUnprofitable = false,
} = {}) {
  const cents = Number(amountCents);
  if (!Number.isInteger(cents) || cents <= 0) {
    return { ok: false, error: 'Amount must be a positive integer number of cents' };
  }
  const floorCents = pilotFloorCents(planCode);
  const belowFloor = floorCents != null && cents < floorCents;
  if (belowFloor && !allowBelowFloor) {
    return {
      ok: false,
      error: `Amount is below the pilot floor of $${(floorCents / 100).toFixed(2)} for ${planCode}`,
      belowFloor: true,
      floorCents,
    };
  }
  const retainedCents = estimateRetainedCents(cents, { kind });
  const unprofitable = retainedCents == null || retainedCents <= 0;
  if (unprofitable && !allowUnprofitable) {
    return {
      ok: false,
      error: 'Amount would be unprofitable after the 75% scooper share and Stripe fees; set allowUnprofitable to override',
      unprofitable: true,
      retainedCents,
      floorCents,
      belowFloor,
    };
  }
  return { ok: true, belowFloor, unprofitable, floorCents, retainedCents };
}

/** Active market whose zipCodes include this ZIP, or null. */
export async function findMarketByZip(zipCode, { db, now = new Date() } = {}) {
  const zip = normalizeZip(zipCode);
  if (!zip || !db) return null;
  const markets = await db.market.findMany({
    where: { active: true },
    include: {
      prices: {
        where: {
          effectiveFrom: { lte: now },
          OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
        },
        orderBy: { effectiveFrom: 'desc' },
      },
    },
    orderBy: { name: 'asc' },
  });
  return markets.find((m) => (m.zipCodes || []).map(normalizeZip).includes(zip)) || null;
}

/**
 * Resolve the sellable amount for a catalog plan in a market.
 * Prefers an active MarketPrice (with optional stripePriceId), else the
 * global catalog env Stripe Price ID / display amount. Never mutates
 * existing subscriptions.
 */
export function resolveMarketPlanPrice(item, market, env = process.env) {
  if (!item) return null;
  const override = (market?.prices || []).find((p) => p.planCode === item.id);
  const catalogPriceId = getConfiguredPriceId(item, env);
  if (override) {
    return {
      planCode: item.id,
      amountCents: override.amountCents,
      amount: override.amountCents / 100,
      stripePriceId: override.stripePriceId || catalogPriceId,
      source: 'market',
      marketId: market.id,
      marketName: market.name,
      marketPriceId: override.id,
    };
  }
  return {
    planCode: item.id,
    amountCents: Math.round(Number(item.displayAmount) * 100),
    amount: item.displayAmount,
    stripePriceId: catalogPriceId,
    source: 'catalog',
    marketId: market?.id || null,
    marketName: market?.name || null,
    marketPriceId: null,
  };
}

export async function resolvePriceForZip(planIdOrAlias, zipCode, { db, env = process.env, now = new Date() } = {}) {
  const item = findPlan(planIdOrAlias);
  if (!item) return null;
  const market = await findMarketByZip(zipCode, { db, now });
  return resolveMarketPlanPrice(item, market, env);
}
