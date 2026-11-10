import { stripe as defaultStripe } from '@/lib/stripe';
import { ALL_CATALOG_ITEMS, INITIAL_CLEANUP, PLANS, findPlan, getConfiguredPriceId } from '@/lib/pricing-catalog';
import { findMarketByZip, resolveMarketPlanPrice } from '@/lib/pricing-markets';
import { applyPromotion, findPromotionByCode } from '@/lib/pricing-promotions';
import { resolveApprovedQuoteForCheckout } from '@/lib/pricing-quotes';

function priceMatchesPlan(price, item) {
    if (!price || !price.active || price.currency !== 'usd') return false;
    if (item.kind === 'subscription') {
        return price.type === 'recurring' && price.recurring?.interval === item.interval;
    }
    return price.type === 'one_time';
}

async function resolveItem(item, { stripe, env }) {
    const priceId = getConfiguredPriceId(item, env);
    const resolved = {
        id: item.id,
        name: item.name,
        description: item.description,
        kind: item.kind,
        frequency: item.interval,
        interval: item.interval,
        numberOfDogs: item.numberOfDogs ?? null,
        serviceCount: item.serviceCount,
        features: item.features,
        popular: Boolean(item.popular),
        startingAt: Boolean(item.startingAt),
        priceId,
        price: item.displayAmount,
        available: false,
        unavailableReason: null,
    };

    if (!priceId) {
        resolved.unavailableReason = `${item.priceEnv} is not set`;
        return resolved;
    }

    if (!stripe) {
        // Without the secret key we cannot confirm the amount, so only sell
        // plans whose amount is already agreed.
        resolved.available = item.displayAmount != null;
        if (!resolved.available) resolved.unavailableReason = 'Stripe is not configured';
        return resolved;
    }

    try {
        const price = await stripe.prices.retrieve(priceId);
        if (!priceMatchesPlan(price, item)) {
            console.error(`[pricing] ${item.priceEnv}=${priceId} is inactive or not a ${item.kind} USD price`);
            resolved.unavailableReason = 'Configured Stripe price does not match this plan';
            return resolved;
        }
        const amount = price.unit_amount / 100;
        if (item.displayAmount != null && amount !== item.displayAmount) {
            console.warn(`[pricing] ${item.id}: Stripe price is $${amount}, catalog says $${item.displayAmount}; using Stripe`);
        }
        resolved.price = amount;
        resolved.available = true;
    } catch (error) {
        console.error(`[pricing] Could not retrieve ${item.priceEnv}=${priceId}:`, error.message);
        resolved.available = item.displayAmount != null;
        if (!resolved.available) resolved.unavailableReason = 'Stripe price lookup failed';
    }
    return resolved;
}

export async function getPricingPlans({ stripe = defaultStripe, env = process.env, includeInitialCleanup = false } = {}) {
    const items = includeInitialCleanup ? ALL_CATALOG_ITEMS : PLANS;
    return Promise.all(items.map((item) => resolveItem(item, { stripe, env })));
}

// Catch-up cleanup as a one-time line on a subscription's first invoice: the
// configured Stripe price, else the pilot fallback amount.
export function getInitialCleanupLineItem(env = process.env) {
    const priceId = getConfiguredPriceId(INITIAL_CLEANUP, env);
    if (priceId) return { price: priceId, quantity: 1 };
    return {
        price_data: {
            currency: 'usd',
            product_data: { name: INITIAL_CLEANUP.name },
            unit_amount: INITIAL_CLEANUP.fallbackChargeCents,
        },
        quantity: 1,
    };
}

// Resolves a plan the client asked to buy. Only catalog plans with a
// configured price ID can be purchased; arbitrary price IDs are rejected.
// Optional zipCode / market overlays swap the Stripe Price when a MarketPrice
// carries its own stripePriceId; live subscriptions stay on their old Price.
export function resolvePurchasablePlan({ planId, priceId }, env = process.env) {
    const item = planId
        ? findPlan(planId)
        : ALL_CATALOG_ITEMS.find((candidate) => getConfiguredPriceId(candidate, env) === priceId);
    if (!item) return null;
    const configuredPriceId = getConfiguredPriceId(item, env);
    if (!configuredPriceId) return null;
    if (priceId && priceId !== configuredPriceId) return null;
    return { item, priceId: configuredPriceId };
}

/**
 * Like resolvePurchasablePlan, but applies an optional market override by ZIP.
 * Existing subscriptions are never rewritten — only new checkouts use this.
 */
export async function resolvePurchasablePlanForMarket({ planId, priceId, zipCode }, { db, env = process.env, now = new Date() } = {}) {
    const base = resolvePurchasablePlan({ planId, priceId }, env);
    if (!base) return null;
    if (!zipCode || !db) return { ...base, market: null, amountCents: Math.round(base.item.displayAmount * 100), source: 'catalog' };

    const market = await findMarketByZip(zipCode, { db, now });
    const resolved = resolveMarketPlanPrice(base.item, market, env);
    if (!resolved?.stripePriceId) return null;
    // Market overrides that only change the display amount still need a Stripe
    // Price ID (override or catalog). Client-supplied custom amounts stay blocked.
    return {
        item: base.item,
        priceId: resolved.stripePriceId,
        market,
        amountCents: resolved.amountCents,
        source: resolved.source,
    };
}

export async function resolveCheckoutPromotion({ promoCode, amountCents, planCode, marketId, db, now = new Date() } = {}) {
    if (!promoCode) return null;
    const promo = await findPromotionByCode(promoCode, { db });
    if (!promo) return { ok: false, error: 'Unknown promotion code', code: 'invalid_promo' };
    return applyPromotion(promo, { amountCents, planCode, marketId, now });
}

export { resolveApprovedQuoteForCheckout };
