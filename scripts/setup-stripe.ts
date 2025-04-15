import * as dotenv from 'dotenv';
// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

import { stripe } from '../src/lib/stripe';
import Stripe from 'stripe';

async function setupStripeProducts() {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in .env.local');
    }

    // Monthly Subscription Products
    const monthlyProducts = [
      {
        name: 'Single Dog Monthly',
        description: 'Weekly yard cleaning for 1 dog',
        prices: [
          {
            unit_amount: 5500, // $55.00 in cents
            currency: 'usd',
            recurring: {
              interval: 'month' as const,
            },
          },
        ],
      },
      {
        name: 'Two Dogs Monthly',
        description: 'Weekly yard cleaning for 2 dogs',
        prices: [
          {
            unit_amount: 7000, // $70.00 in cents
            currency: 'usd',
            recurring: {
              interval: 'month' as const,
            },
          },
        ],
      },
      {
        name: 'Three+ Dogs Monthly',
        description: 'Weekly yard cleaning for 3 or more dogs',
        prices: [
          {
            unit_amount: 10000, // $100.00 in cents
            currency: 'usd',
            recurring: {
              interval: 'month' as const,
            },
          },
        ],
      },
    ];

    // One-Time Cleanup Products
    const oneTimeProducts = [
      {
        name: 'One-Time Cleanup (1 Dog)',
        description: 'Single yard cleaning for 1 dog',
        prices: [
          {
            unit_amount: 7500, // $75.00 in cents
            currency: 'usd',
          },
        ],
      },
      {
        name: 'One-Time Cleanup (2 Dogs)',
        description: 'Single yard cleaning for 2 dogs',
        prices: [
          {
            unit_amount: 9000, // $90.00 in cents
            currency: 'usd',
          },
        ],
      },
      {
        name: 'One-Time Cleanup (3+ Dogs)',
        description: 'Single yard cleaning for 3 or more dogs',
        prices: [
          {
            unit_amount: 12000, // $120.00 in cents
            currency: 'usd',
          },
        ],
      },
    ];

    console.log('Setting up monthly subscription products...');
    for (const product of monthlyProducts) {
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
        metadata: {
          type: 'subscription',
          service_frequency: 'weekly',
        },
      });

      for (const price of product.prices) {
        const stripePrice = await stripe.prices.create({
          product: stripeProduct.id,
          ...price,
        } as Stripe.PriceCreateParams);

        console.log(`Created price: ${stripePrice.id} for product: ${product.name}`);
      }

      console.log(`Created product: ${product.name}`);
    }

    console.log('\nSetting up one-time cleanup products...');
    for (const product of oneTimeProducts) {
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
        metadata: {
          type: 'one-time',
        },
      });

      for (const price of product.prices) {
        const stripePrice = await stripe.prices.create({
          product: stripeProduct.id,
          ...price,
        } as Stripe.PriceCreateParams);

        console.log(`Created price: ${stripePrice.id} for product: ${product.name}`);
      }

      console.log(`Created product: ${product.name}`);
    }

    console.log('\nSetup complete! Please save these price IDs to update your pricing page.');
  } catch (error) {
    console.error('Error setting up Stripe products:', error);
  }
}

setupStripeProducts(); 