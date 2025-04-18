import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';

// Initialize Stripe with your publishable key
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripePublishableKey) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
}

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripePromise = loadStripe(stripePublishableKey);

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Price IDs for services
export const STRIPE_PRICE_IDS = {
  MONTHLY_SUBSCRIPTION: process.env.STRIPE_MONTHLY_PRICE_ID,
  ONE_TIME_CLEANUP: process.env.STRIPE_CLEANUP_PRICE_ID,
};

// Webhook event types we handle
export const STRIPE_WEBHOOK_EVENTS = {
  CUSTOMER_SUBSCRIPTION_CREATED: 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
};

export const createStripeCustomer = async (email: string, name: string, phone?: string) => {
  return stripe.customers.create({
    email,
    name,
    phone,
  });
};

export const createStripeSubscription = async (
  customerId: string,
  paymentMethodId: string
) => {
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

export const createOneTimeCharge = async (
  customerId: string,
  amount: number,
  description: string
) => {
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

export const cancelStripeSubscription = async (subscriptionId: string) => {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
};

export const handleStripeWebhook = async (payload: Buffer, signature: string) => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set in environment variables');
  }

  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );

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