import Stripe from 'stripe';

const isDev = process.env.NODE_ENV === 'development';
const isNonSecureMode = process.env.NEXT_PUBLIC_NON_SECURE_MODE === 'true';
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Initialize Stripe only on the server side
let stripe = null;

// Server-side only code
if (typeof window === 'undefined') {
  const secretKey = stripeSecretKey;

  if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required. Please set it in your environment variables.');
  }
  stripe = new Stripe(secretKey, {
    apiVersion: '2023-10-16',
  });
}

// Create a subscription with a specified plan - server side only
export const createSubscription = async (
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