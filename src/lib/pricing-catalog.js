// Single source of truth for Scoopify plans.
//
// What a customer is charged is always the Stripe Price whose ID is set in the
// plan's env var (`priceEnv`). `displayAmount` is only shown when Stripe cannot
// be reached; the server replaces it with the Stripe Price's unit_amount.
//
// Provisional pilot pricing set by Matthew on 2026-11-09, not final until 30+
// completed cleanings (docs/pilot-pricing.md lists the Stripe Prices to create):
//   - Weekly club: $79 / $89 / $99 per month for 1 / 2 / 3 dogs.
//   - One-time cleanup: from $79 / $99 / $119 for 1 / 2 / 3 dogs.
//   - Initial catch-up cleanup on a new subscription: from $49.
//   - New subscribers prepay one month plus the catch-up (UPFRONT_POLICY).
//   - 4+ dogs get a quote instead of checkout (QUOTE_MIN_DOGS).
// "From" amounts are the Stripe Price charged at checkout; larger or
// neglected yards are adjusted by quote, never in checkout.
//
// This module is safe to import from client components: it holds no secrets,
// and the env lookups only resolve on the server.

export const PRICING_NOTE = 'Provisional pilot pricing (2026-11-09)';

// Dog counts at or above this are quoted by a person, not sold online.
export const QUOTE_MIN_DOGS = 4;
export const QUOTE_REQUEST_PATH = '/contact?subject=' + encodeURIComponent('Quote request: 4+ dogs');

const MONTHLY_FEATURES = (dogs) => ['Weekly service', dogs, '4 services per month'];
const ONE_TIME_FEATURES = (dogs) => ['One-time cleanup', dogs, 'No subscription required'];

export const PLANS = [
    {
        id: 'single-dog-monthly',
        name: 'Single Dog',
        description: 'Weekly service for 1 dog',
        kind: 'subscription',
        interval: 'month',
        numberOfDogs: 1,
        serviceCount: 4,
        displayAmount: 79,
        priceEnv: 'STRIPE_MONTHLY_1_DOG_PRICE_ID',
        legacyPriceEnvs: ['STRIPE_SINGLE_DOG_PRICE_ID'],
        aliases: ['weekly-1', 'weekly-1-dog', 'single_dog'],
        features: MONTHLY_FEATURES('1 dog'),
        popular: false,
    },
    {
        id: 'two-dogs-monthly',
        name: 'Two Dogs',
        description: 'Weekly service for 2 dogs',
        kind: 'subscription',
        interval: 'month',
        numberOfDogs: 2,
        serviceCount: 4,
        displayAmount: 89,
        priceEnv: 'STRIPE_MONTHLY_2_DOGS_PRICE_ID',
        legacyPriceEnvs: ['STRIPE_TWO_DOGS_PRICE_ID'],
        aliases: ['weekly-2', 'weekly-2-dogs', 'two_dogs'],
        features: MONTHLY_FEATURES('2 dogs'),
        popular: true,
    },
    {
        id: 'three-plus-dogs-monthly',
        name: 'Three Dogs',
        description: 'Weekly service for 3 dogs',
        kind: 'subscription',
        interval: 'month',
        numberOfDogs: 3,
        serviceCount: 4,
        displayAmount: 99,
        priceEnv: 'STRIPE_MONTHLY_3_PLUS_DOGS_PRICE_ID',
        legacyPriceEnvs: ['STRIPE_THREE_PLUS_DOGS_PRICE_ID'],
        aliases: ['weekly-3', 'weekly-3-plus-dogs', 'three_plus_dogs'],
        features: MONTHLY_FEATURES('3 dogs'),
        popular: false,
    },
    {
        id: 'one-time-single-dog',
        name: 'One-Time Cleanup (1 Dog)',
        description: 'Single cleanup for 1 dog',
        kind: 'one_time',
        interval: 'one-time',
        numberOfDogs: 1,
        serviceCount: 1,
        displayAmount: 79,
        startingAt: true,
        priceEnv: 'STRIPE_ONETIME_1_DOG_PRICE_ID',
        legacyPriceEnvs: ['STRIPE_ONE_TIME_SINGLE_DOG_PRICE_ID'],
        aliases: ['one-time-1', 'one-time-1-dog', 'one_time_single_dog'],
        features: ONE_TIME_FEATURES('1 dog'),
        popular: false,
    },
    {
        id: 'one-time-two-dogs',
        name: 'One-Time Cleanup (2 Dogs)',
        description: 'Single cleanup for 2 dogs',
        kind: 'one_time',
        interval: 'one-time',
        numberOfDogs: 2,
        serviceCount: 1,
        displayAmount: 99,
        startingAt: true,
        priceEnv: 'STRIPE_ONETIME_2_DOGS_PRICE_ID',
        legacyPriceEnvs: ['STRIPE_ONE_TIME_TWO_DOGS_PRICE_ID'],
        aliases: ['one-time-2', 'one-time-2-dogs', 'one_time_two_dogs'],
        features: ONE_TIME_FEATURES('2 dogs'),
        popular: false,
    },
    {
        id: 'one-time-three-plus-dogs',
        name: 'One-Time Cleanup (3 Dogs)',
        description: 'Single cleanup for 3 dogs',
        kind: 'one_time',
        interval: 'one-time',
        numberOfDogs: 3,
        serviceCount: 1,
        displayAmount: 119,
        startingAt: true,
        priceEnv: 'STRIPE_ONETIME_3_PLUS_DOGS_PRICE_ID',
        legacyPriceEnvs: ['STRIPE_ONE_TIME_THREE_PLUS_DOGS_PRICE_ID'],
        aliases: ['one-time-3', 'one-time-3-plus-dogs', 'one_time_three_plus_dogs'],
        features: ONE_TIME_FEATURES('3 dogs'),
        popular: false,
    },
];

export const INITIAL_CLEANUP = {
    id: 'initial-cleanup',
    name: 'Initial Catch-Up Cleanup',
    description: 'One-time catch-up cleanup before weekly service starts',
    kind: 'one_time',
    interval: 'one-time',
    serviceCount: 1,
    displayAmount: 49,
    startingAt: true,
    priceEnv: 'STRIPE_INITIAL_CLEANUP_PRICE_ID',
    legacyPriceEnvs: [],
    aliases: ['initial_cleanup'],
    features: ['Initial catch-up cleanup', 'One-time fee'],
    // Charged as an inline price only while STRIPE_INITIAL_CLEANUP_PRICE_ID is unset.
    fallbackChargeCents: 4900,
};

// What a new subscriber pays at signup checkout: the first month (the
// subscription's first invoice) plus the INITIAL_CLEANUP catch-up. There is no
// two-month upfront charge.
export const UPFRONT_POLICY = 'FIRST_MONTH_PLUS_CATCH_UP';

export const ALL_CATALOG_ITEMS = [...PLANS, INITIAL_CLEANUP];

export function findPlan(idOrAlias) {
    if (!idOrAlias) return null;
    const key = String(idOrAlias).trim().toLowerCase();
    return ALL_CATALOG_ITEMS.find((item) => item.id === key || item.aliases.includes(key)) || null;
}

export function getConfiguredPriceId(item, env = process.env) {
    for (const name of [item.priceEnv, ...item.legacyPriceEnvs]) {
        const value = env[name];
        if (value && value.trim()) return value.trim();
    }
    return null;
}

export function findPlanByPriceId(priceId, env = process.env) {
    if (!priceId) return null;
    return ALL_CATALOG_ITEMS.find((item) => getConfiguredPriceId(item, env) === priceId) || null;
}
