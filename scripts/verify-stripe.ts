import * as dotenv from 'dotenv';
import { resolve } from 'path';
import Stripe from 'stripe';

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in .env.local');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function verifyStripeSetup() {
  try {
    // List all active products
    const products = await stripe.products.list({
      active: true,
    });

    console.log('\nExisting Products:');
    products.data.forEach(product => {
      console.log(`- ${product.name} (${product.id})`);
    });

    // List all active prices
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product']
    });

    console.log('\nExisting Prices:');
    prices.data.forEach(price => {
      const product = price.product as any;
      console.log(`- ${product.name}: $${price.unit_amount! / 100} ${price.recurring ? '(recurring)' : '(one-time)'}`);
      console.log(`  ID: ${price.id}`);
    });

  } catch (error) {
    console.error('Error verifying Stripe setup:', error);
    process.exit(1);
  }
}

verifyStripeSetup(); 