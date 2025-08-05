import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';

// Environment validation
const validateStripeEnvironment = () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  // Validate keys are present
  if (!publishableKey) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required');
  }

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is required');
  }

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required');
  }

  // Validate key formats
  if (isProduction) {
    if (!publishableKey.startsWith('pk_live_')) {
      throw new Error('Production environment requires live Stripe keys (pk_live_)');
    }
    if (!secretKey.startsWith('sk_live_')) {
      throw new Error('Production environment requires live Stripe keys (sk_live_)');
    }
  } else {
    if (!publishableKey.startsWith('pk_test_') && !publishableKey.startsWith('pk_live_')) {
      throw new Error('Invalid Stripe publishable key format');
    }
    if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
      throw new Error('Invalid Stripe secret key format');
    }
  }

  return {
    publishableKey,
    secretKey,
    webhookSecret,
    isProduction
  };
};

// Initialize Stripe configuration
const stripeConfig = validateStripeEnvironment();

// Client-side Stripe instance
export const stripePromise = loadStripe(stripeConfig.publishableKey);

// Server-side Stripe instance
let stripe = null;
if (typeof window === 'undefined') {
  stripe = new Stripe(stripeConfig.secretKey, {
    apiVersion: '2023-10-16',
    typescript: true,
    maxNetworkRetries: 3,
    timeout: 30000, // 30 seconds
  });
}

// Production price IDs (these should be set in environment variables)
export const STRIPE_PRICE_IDS = {
  MONTHLY_SUBSCRIPTION: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
  ONE_TIME_CLEANUP: process.env.NEXT_PUBLIC_STRIPE_CLEANUP_PRICE_ID,
  WEEKLY_SUBSCRIPTION: process.env.NEXT_PUBLIC_STRIPE_WEEKLY_PRICE_ID,
  BIWEEKLY_SUBSCRIPTION: process.env.NEXT_PUBLIC_STRIPE_BIWEEKLY_PRICE_ID,
};

// Validate price IDs
const validatePriceIds = () => {
  const missingPrices = [];
  
  Object.entries(STRIPE_PRICE_IDS).forEach(([key, value]) => {
    if (!value) {
      missingPrices.push(key);
    } else if (!value.startsWith('price_')) {
      throw new Error(`Invalid price ID format for ${key}: ${value}`);
    }
  });

  if (missingPrices.length > 0) {
    console.warn(`Missing Stripe price IDs: ${missingPrices.join(', ')}`);
  }
};

validatePriceIds();

// Enhanced Stripe customer creation with validation
export const createStripeCustomer = async (email, name, phone, metadata = {}) => {
  if (typeof window !== 'undefined' || !stripe) {
    throw new Error('This function can only be called from the server');
  }

  // Validate input
  if (!email || !email.includes('@')) {
    throw new Error('Valid email is required');
  }

  if (!name || name.trim().length < 2) {
    throw new Error('Valid name is required');
  }

  try {
    const customer = await stripe.customers.create({
      email: email.toLowerCase().trim(),
      name: name.trim(),
      phone: phone ? phone.trim() : undefined,
      metadata: {
        ...metadata,
        created_at: new Date().toISOString(),
        environment: stripeConfig.isProduction ? 'production' : 'development'
      }
    });

    console.log(`[STRIPE] Created customer: ${customer.id} for ${email}`);
    return customer;
  } catch (error) {
    console.error('[STRIPE] Error creating customer:', error);
    throw new Error(`Failed to create customer: ${error.message}`);
  }
};

// Enhanced checkout session creation with validation
export const createCheckoutSession = async (params) => {
  if (typeof window !== 'undefined' || !stripe) {
    throw new Error('This function can only be called from the server');
  }

  const {
    priceId,
    customerId,
    successUrl,
    cancelUrl,
    mode = 'subscription',
    metadata = {},
    allowPromotionCodes = false,
    billingAddressCollection = 'required',
    taxIdCollection = { enabled: true }
  } = params;

  // Validate required parameters
  if (!priceId || !priceId.startsWith('price_')) {
    throw new Error('Valid price ID is required');
  }

  if (!successUrl || !cancelUrl) {
    throw new Error('Success and cancel URLs are required');
  }

  if (!['subscription', 'payment'].includes(mode)) {
    throw new Error('Mode must be either "subscription" or "payment"');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: allowPromotionCodes,
      billing_address_collection: billingAddressCollection,
      tax_id_collection: taxIdCollection,
      metadata: {
        ...metadata,
        created_at: new Date().toISOString(),
        environment: stripeConfig.isProduction ? 'production' : 'development'
      }
    });

    console.log(`[STRIPE] Created checkout session: ${session.id}`);
    return session;
  } catch (error) {
    console.error('[STRIPE] Error creating checkout session:', error);
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }
};

// Enhanced webhook verification
export const verifyWebhookSignature = async (payload, signature) => {
  if (typeof window !== 'undefined' || !stripe) {
    throw new Error('This function can only be called from the server');
  }

  if (!payload || !signature) {
    throw new Error('Payload and signature are required');
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      stripeConfig.webhookSecret
    );

    console.log(`[STRIPE] Verified webhook: ${event.type} (${event.id})`);
    return event;
  } catch (error) {
    console.error('[STRIPE] Webhook signature verification failed:', error);
    throw new Error(`Webhook signature verification failed: ${error.message}`);
  }
};

// Enhanced payment intent creation
export const createPaymentIntent = async (params) => {
  if (typeof window !== 'undefined' || !stripe) {
    throw new Error('This function can only be called from the server');
  }

  const {
    amount,
    currency = 'usd',
    customerId,
    description,
    metadata = {},
    idempotencyKey
  } = params;

  // Validate amount
  if (!amount || amount < 50) { // Minimum $0.50
    throw new Error('Amount must be at least 50 cents');
  }

  if (amount > 999999) { // Maximum $9,999.99
    throw new Error('Amount cannot exceed $9,999.99');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      description,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        ...metadata,
        created_at: new Date().toISOString(),
        environment: stripeConfig.isProduction ? 'production' : 'development'
      }
    }, {
      idempotencyKey
    });

    console.log(`[STRIPE] Created payment intent: ${paymentIntent.id}`);
    return paymentIntent;
  } catch (error) {
    console.error('[STRIPE] Error creating payment intent:', error);
    throw new Error(`Failed to create payment intent: ${error.message}`);
  }
};

// Enhanced refund creation
export const createRefund = async (params) => {
  if (typeof window !== 'undefined' || !stripe) {
    throw new Error('This function can only be called from the server');
  }

  const {
    paymentIntentId,
    amount,
    reason = 'requested_by_customer',
    metadata = {}
  } = params;

  if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
    throw new Error('Valid payment intent ID is required');
  }

  if (!['duplicate', 'fraudulent', 'requested_by_customer'].includes(reason)) {
    throw new Error('Invalid refund reason');
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
      reason,
      metadata: {
        ...metadata,
        refunded_at: new Date().toISOString(),
        environment: stripeConfig.isProduction ? 'production' : 'development'
      }
    });

    console.log(`[STRIPE] Created refund: ${refund.id} for ${paymentIntentId}`);
    return refund;
  } catch (error) {
    console.error('[STRIPE] Error creating refund:', error);
    throw new Error(`Failed to create refund: ${error.message}`);
  }
};

// Export the server-side Stripe instance
export { stripe };

// Export configuration for reference
export const stripeEnvironment = {
  isProduction: stripeConfig.isProduction,
  publishableKeyPrefix: stripeConfig.publishableKey.substring(0, 7),
  secretKeyPrefix: stripeConfig.secretKey.substring(0, 7),
  hasWebhookSecret: !!stripeConfig.webhookSecret
}; 