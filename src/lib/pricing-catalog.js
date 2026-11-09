// Single source of truth for Scoopify plans.
//
// What a customer is charged is always the Stripe Price whose ID is set in the
// plan's env var (`priceEnv`). `displayAmount` is only shown when Stripe cannot
// be reached; the server replaces it with the Stripe Price's unit_amount.
//
// Business decisions still PENDING (owner: Matthew). Until decided, the
// related plans carry `displayAmount: null` and a `pendingDecision` note, and
// are only sellable once a Stripe Price ID is configured for them:
//   - One-time cleanup prices: code had $25/$35/$45 (API, seed) and
//     $75/$90/$120 (pricing and signup UI).
//   - Initial cleanup fee: code had $30 (signup charge), $32 (API, seed),
//     $69 at 50% off (payment page) and $89 (dashboard copy).
//   - Upfront rule for new subscriptions: two months upfront vs first month
//     plus the initial cleanup. See UPFRONT_POLICY.
//
// This module is safe to import from client components: it holds no secrets,
// and the env lookups only resolve on the server.

export const PENDING_ONE_TIME_PRICE =
    'One-time cleanup price not decided (code had $25/$35/$45 vs $75/$90/$120). Set the Stripe Price ID once decided.';
export const PENDING_INITIAL_CLEANUP_FEE =
    'Initial cleanup fee not decided (code had $30, $32, $34.50 and $89). Set the Stripe Price ID once decided.';

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
        displayAmount: 55,
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
        displayAmount: 70,
        priceEnv: 'STRIPE_MONTHLY_2_DOGS_PRICE_ID',
        legacyPriceEnvs: ['STRIPE_TWO_DOGS_PRICE_ID'],
        aliases: ['weekly-2', 'weekly-2-dogs', 'two_dogs'],
        features: MONTHLY_FEATURES('2 dogs'),
        popular: true,
    },
    {
        id: 'three-plus-dogs-monthly',
        name: 'Three+ Dogs',
        description: 'Weekly service for 3 or more dogs',
        kind: 'subscription',
        interval: 'month',
        numberOfDogs: '3+',
        serviceCount: 4,
        displayAmount: 100,
        priceEnv: 'STRIPE_MONTHLY_3_PLUS_DOGS_PRICE_ID',
        legacyPriceEnvs: ['STRIPE_THREE_PLUS_DOGS_PRICE_ID'],
        aliases: ['weekly-3', 'weekly-3-plus-dogs', 'three_plus_dogs'],
        features: MONTHLY_FEATURES('3+ dogs'),
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
        displayAmount: null,
        pendingDecision: PENDING_ONE_TIME_PRICE,
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
        displayAmount: null,
        pendingDecision: PENDING_ONE_TIME_PRICE,
        priceEnv: 'STRIPE_ONETIME_2_DOGS_PRICE_ID',
        legacyPriceEnvs: ['STRIPE_ONE_TIME_TWO_DOGS_PRICE_ID'],
        aliases: ['one-time-2', 'one-time-2-dogs', 'one_time_two_dogs'],
        features: ONE_TIME_FEATURES('2 dogs'),
        popular: false,
    },
    {
        id: 'one-time-three-plus-dogs',
        name: 'One-Time Cleanup (3+ Dogs)',
        description: 'Single cleanup for 3 or more dogs',
        kind: 'one_time',
        interval: 'one-time',
        numberOfDogs: '3+',
        serviceCount: 1,
        displayAmount: null,
        pendingDecision: PENDING_ONE_TIME_PRICE,
        priceEnv: 'STRIPE_ONETIME_3_PLUS_DOGS_PRICE_ID',
        legacyPriceEnvs: ['STRIPE_ONE_TIME_THREE_PLUS_DOGS_PRICE_ID'],
        aliases: ['one-time-3', 'one-time-3-plus-dogs', 'one_time_three_plus_dogs'],
        features: ONE_TIME_FEATURES('3+ dogs'),
        popular: false,
    },
];

export const INITIAL_CLEANUP = {
    id: 'initial-cleanup',
    name: 'Initial Cleanup',
    description: 'One-time initial cleanup for new subscriptions',
    kind: 'one_time',
    interval: 'one-time',
    serviceCount: 1,
    displayAmount: null,
    pendingDecision: PENDING_INITIAL_CLEANUP_FEE,
    priceEnv: 'STRIPE_INITIAL_CLEANUP_PRICE_ID',
    legacyPriceEnvs: [],
    aliases: ['initial_cleanup'],
    features: ['Initial cleanup', 'One-time fee'],
    // PENDING: the amount /api/auth/signup charged before this catalog existed.
    // Used only while STRIPE_INITIAL_CLEANUP_PRICE_ID is unset, so signup keeps
    // its current behavior until Matthew decides the fee.
    legacySignupChargeCents: 3000,
};

// PENDING (Matthew): how much a new subscriber pays upfront. Checkout charges
// only the plan's Stripe Price until this is set; no cleanup line item and no
// second month is added.
//   null                    -> plan price only (current behavior)
//   'TWO_MONTHS'            -> two months upfront
//   'FIRST_MONTH_PLUS_CLEANUP' -> first month + INITIAL_CLEANUP price
export const UPFRONT_POLICY = null;

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
