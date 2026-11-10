import { loadStripe } from '@stripe/stripe-js';

// Browser-safe Stripe.js loader. Never import '@/lib/stripe' from client
// components: it pulls in the Node SDK and server-only secrets.
let stripePromise = null;

export function getStripe() {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
        console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set; Stripe.js will not load');
        return Promise.resolve(null);
    }
    if (!stripePromise) {
        stripePromise = loadStripe(publishableKey);
    }
    return stripePromise;
}
