// Server-only Stripe module. Client components must use '@/lib/stripe-client'.
// Importing this file must never throw: Next imports route modules while
// collecting page data at build time, and missing keys would fail the build.
import Stripe from 'stripe';
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const isDev = process.env.NODE_ENV === 'development';
const isNonSecureMode = process.env.NEXT_PUBLIC_NON_SECURE_MODE === 'true';
// Forward export for convenience
export * from './stripe-subscriptions';
if (typeof window !== 'undefined') {
    console.error("'@/lib/stripe' is server-only; import '@/lib/stripe-client' in client components");
}
else if (!stripeSecretKey) {
    console.warn('STRIPE_SECRET_KEY is not set; server-side Stripe calls are disabled');
}
// Warn if running in non-secure mode
if (isNonSecureMode && isDev) {
    console.warn('⚠️ Running in non-secure mode. Stripe operations may not work correctly.');
    console.warn('⚠️ For proper Stripe functionality, please set up SSL certificates.');
}
// Legacy placeholders; real price IDs live in '@/lib/pricing-catalog'.
export const STRIPE_PRICE_IDS = {
    MONTHLY_SUBSCRIPTION: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || 'price_monthly',
    ONE_TIME_CLEANUP: process.env.NEXT_PUBLIC_STRIPE_CLEANUP_PRICE_ID || 'price_cleanup',
};
// Webhook event types - these are just string constants, safe for client
export const STRIPE_WEBHOOK_EVENTS = {
    CUSTOMER_SUBSCRIPTION_CREATED: 'customer.subscription.created',
    CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
    CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
    INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
    INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
};
// Initialize Stripe only on the server side
let stripe = null;
if (typeof window === 'undefined' && stripeSecretKey) {
    stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
        typescript: true,
    });
}
// For callers that cannot proceed without Stripe (e.g. the webhook).
export function requireStripe() {
    if (!stripe) {
        throw new Error('Stripe is not configured: STRIPE_SECRET_KEY is missing');
    }
    return stripe;
}
// Create a Stripe customer - server side only function
const createStripeCustomer = async (email, name, phone) => {
    if (typeof window !== 'undefined' || !stripe) {
        throw new Error('This function can only be called from the server');
    }
    if (isNonSecureMode && isDev) {
        console.warn('⚠️ Creating mock Stripe customer in non-secure mode');
        return { id: `customer_mock_${Date.now()}`, email, name, phone };
    }
    return stripe.customers.create({
        email,
        name,
        phone,
    });
};
// Create a Stripe subscription - server side only
const createStripeSubscription = async (customerId, paymentMethodId) => {
    if (typeof window !== 'undefined' || !stripe) {
        throw new Error('This function can only be called from the server');
    }
    if (isNonSecureMode && isDev) {
        console.warn('⚠️ Creating mock Stripe subscription in non-secure mode');
        return {
            id: `sub_mock_${Date.now()}`,
            status: 'active',
            customer: customerId,
            latest_invoice: {
                payment_intent: { status: 'succeeded', client_secret: 'mock_secret' }
            }
        };
    }
    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
    });
    // Set as default payment method
    await stripe.customers.update(customerId, {
        invoice_settings: {
            default_payment_method: paymentMethodId,
        },
    });
    // Create subscription
    return stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: STRIPE_PRICE_IDS.MONTHLY_SUBSCRIPTION }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
            payment_method_types: ['card'],
            save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
    });
};
// Create a one-time charge - server side only
const createOneTimeCharge = async (customerId, amount, description) => {
    if (typeof window !== 'undefined' || !stripe) {
        throw new Error('This function can only be called from the server');
    }
    if (isNonSecureMode && isDev) {
        console.warn('⚠️ Creating mock payment intent in non-secure mode');
        return {
            id: `pi_mock_${Date.now()}`,
            status: 'succeeded',
            client_secret: 'mock_secret',
            amount,
            description
        };
    }
    return stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        customer: customerId,
        description,
        automatic_payment_methods: {
            enabled: true,
        },
    });
};
// Cancel a subscription - server side only
const cancelStripeSubscription = async (subscriptionId) => {
    if (typeof window !== 'undefined' || !stripe) {
        throw new Error('This function can only be called from the server');
    }
    if (isNonSecureMode && isDev) {
        console.warn('⚠️ Cancelling mock subscription in non-secure mode');
        return { id: subscriptionId, status: 'canceled' };
    }
    return stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
    });
};
// Handle webhooks - server side only
const handleStripeWebhook = async (payload, signature) => {
    if (typeof window !== 'undefined' || !stripe) {
        throw new Error('This function can only be called from the server');
    }
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (isNonSecureMode && isDev) {
        console.warn('⚠️ Mock webhook handling in non-secure mode');
        return { received: true };
    }
    if (!webhookSecret) {
        if (isDev) {
            console.warn('⚠️ STRIPE_WEBHOOK_SECRET is not set, using test mode for development');
            return { received: true };
        }
        throw new Error('STRIPE_WEBHOOK_SECRET is not set in environment variables');
    }
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
            // Handle subscription updates
            break;
        case 'customer.subscription.deleted':
            // Handle subscription cancellation
            break;
        case 'invoice.payment_succeeded':
        case 'invoice.payment_failed':
            // Handle payment success/failure
            break;
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
    return { received: true };
};
// Create a Stripe Connect account link for onboarding - server side only
const createStripeConnectAccountLink = async (accountId, refreshUrl, returnUrl) => {
    if (typeof window !== 'undefined' || !stripe) {
        throw new Error('This function can only be called from the server');
    }
    if (isNonSecureMode && isDev) {
        console.warn('⚠️ Creating mock Stripe account link in non-secure mode');
        return {
            url: `https://connect.stripe.com/mock-link/${accountId}`,
            created: Date.now(),
            expires_at: Date.now() + 1000 * 60 * 15 // 15 minutes
        };
    }
    return stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
    });
};
// Create a Stripe Connect account - server side only
const createStripeConnectAccount = async (email, name) => {
    if (typeof window !== 'undefined' || !stripe) {
        throw new Error('This function can only be called from the server');
    }
    if (isNonSecureMode && isDev) {
        console.warn('⚠️ Creating mock Stripe Connect account in non-secure mode');
        return {
            id: `acct_mock_${Date.now()}`,
            email,
            business_profile: { name },
            capabilities: { transfers: 'active' }
        };
    }
    return stripe.accounts.create({
        type: 'express',
        email,
        capabilities: {
            transfers: {
                requested: true,
            },
        },
        business_profile: {
            name,
        },
    });
};
// Create a subscription with a specified plan - server side only
const createSubscription = async (
    customerId,
    planId
) => {
    if (typeof window !== 'undefined' || !stripe) {
        throw new Error('This function can only be called from the server');
    }
    
    if (isNonSecureMode && isDev) {
        console.warn('⚠️ Creating mock Stripe subscription in non-secure mode');
        return { 
            id: `sub_mock_${Date.now()}`,
            status: 'active',
            customer: customerId,
            latest_invoice: {
                payment_intent: { status: 'succeeded', client_secret: 'mock_secret' }
            }
        };
    }
    
    // Create subscription with specified plan
    return stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: planId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
            payment_method_types: ['card'],
            save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
    });
};
// Export server-side functions
export { createStripeCustomer, createStripeSubscription, createOneTimeCharge, cancelStripeSubscription, handleStripeWebhook, createStripeConnectAccountLink, createStripeConnectAccount, createSubscription, stripe };
