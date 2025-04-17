import * as dotenv from 'dotenv';
// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

async function setupStripeProducts() {
  try {
    // Create subscription product
    const subscriptionProduct = await stripe.products.create({
      name: 'Scoopify Monthly Service',
      description: 'Monthly pet waste removal service',
    });

    // Create one-time cleanup product
    const cleanupProduct = await stripe.products.create({
      name: 'Scoopify One-Time Cleanup',
      description: 'One-time pet waste cleanup service',
    });

    // Create prices for subscription plans
    const subscriptionPrices = await Promise.all([
      stripe.prices.create({
        product: subscriptionProduct.id,
        unit_amount: 5500, // $55.00
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        metadata: {
          plan: '1-dog',
        },
      }),
      stripe.prices.create({
        product: subscriptionProduct.id,
        unit_amount: 7000, // $70.00
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        metadata: {
          plan: '2-dog',
        },
      }),
      stripe.prices.create({
        product: subscriptionProduct.id,
        unit_amount: 10000, // $100.00
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        metadata: {
          plan: '3-plus',
        },
      }),
    ]);

    // Create prices for one-time cleanup
    const cleanupPrices = await Promise.all([
      stripe.prices.create({
        product: cleanupProduct.id,
        unit_amount: 7500, // $75.00
        currency: 'usd',
        metadata: {
          plan: '1-dog',
        },
      }),
      stripe.prices.create({
        product: cleanupProduct.id,
        unit_amount: 9000, // $90.00
        currency: 'usd',
        metadata: {
          plan: '2-dog',
        },
      }),
      stripe.prices.create({
        product: cleanupProduct.id,
        unit_amount: 12000, // $120.00
        currency: 'usd',
        metadata: {
          plan: '3-plus',
        },
      }),
    ]);

    console.log('Stripe setup completed successfully!');
    console.log('\nAdd these price IDs to your .env.local file:');
    
    // Subscription price IDs
    console.log('\n# Subscription Price IDs');
    console.log(`STRIPE_1_DOG_PRICE_ID="${subscriptionPrices[0].id}"`);
    console.log(`STRIPE_2_DOG_PRICE_ID="${subscriptionPrices[1].id}"`);
    console.log(`STRIPE_3_PLUS_PRICE_ID="${subscriptionPrices[2].id}"`);
    
    // One-time cleanup price IDs
    console.log('\n# One-Time Cleanup Price IDs');
    console.log(`STRIPE_1_DOG_CLEANUP_PRICE_ID="${cleanupPrices[0].id}"`);
    console.log(`STRIPE_2_DOG_CLEANUP_PRICE_ID="${cleanupPrices[1].id}"`);
    console.log(`STRIPE_3_PLUS_CLEANUP_PRICE_ID="${cleanupPrices[2].id}"`);
  } catch (error) {
    console.error('Error setting up Stripe:', error);
    process.exit(1);
  }
}

setupStripeProducts(); 