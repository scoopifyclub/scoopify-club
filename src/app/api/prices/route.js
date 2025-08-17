import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
// Price types for our dog waste removal business
const PRICE_TYPES = {
    SINGLE_DOG: 'single_dog',
    TWO_DOGS: 'two_dogs',
    THREE_PLUS_DOGS: 'three_plus_dogs',
    ONE_TIME_SINGLE_DOG: 'one_time_single_dog',
    ONE_TIME_TWO_DOGS: 'one_time_two_dogs',
    ONE_TIME_THREE_PLUS_DOGS: 'one_time_three_plus_dogs',
};
// Create default plans structure with real Stripe price IDs
const defaultPlans = [
  {
    id: 'single-dog-monthly',
    name: 'Single Dog - Monthly',
    description: 'Weekly service for 1 dog',
    price: 55.00,
    frequency: 'month',
    serviceCount: 4,
    priceId: process.env.STRIPE_MONTHLY_1_DOG_PRICE_ID || null,
    features: ['Weekly service', '1 dog', '4 services per month']
  },
  {
    id: 'two-dogs-monthly',
    name: 'Two Dogs - Monthly',
    description: 'Weekly service for 2 dogs',
    price: 70.00,
    frequency: 'month',
    serviceCount: 4,
    priceId: process.env.STRIPE_MONTHLY_2_DOGS_PRICE_ID || null,
    features: ['Weekly service', '2 dogs', '4 services per month']
  },
  {
    id: 'three-plus-dogs-monthly',
    name: 'Three+ Dogs - Monthly',
    description: 'Weekly service for 3+ dogs',
    price: 100.00,
    frequency: 'month',
    serviceCount: 4,
    priceId: process.env.STRIPE_MONTHLY_3_PLUS_DOGS_PRICE_ID || null,
    features: ['Weekly service', '3+ dogs', '4 services per month']
  }
];

// One-time service plans
const oneTimePlans = [
  {
    id: 'one-time-single-dog',
    name: 'One-Time Service - 1 Dog',
    description: 'Single service for 1 dog',
    price: 25.00,
    frequency: 'one-time',
    serviceCount: 1,
    priceId: process.env.STRIPE_ONETIME_1_DOG_PRICE_ID || null,
    features: ['One-time service', '1 dog']
  },
  {
    id: 'one-time-two-dogs',
    name: 'One-Time Service - 2 Dogs',
    description: 'Single service for 2 dogs',
    price: 35.00,
    frequency: 'one-time',
    serviceCount: 1,
    priceId: process.env.STRIPE_ONETIME_2_DOGS_PRICE_ID || null,
    features: ['One-time service', '2 dogs']
  },
  {
    id: 'one-time-three-plus-dogs',
    name: 'One-Time Service - 3+ Dogs',
    description: 'Single service for 3+ dogs',
    price: 45.00,
    frequency: 'one-time',
    serviceCount: 1,
    priceId: process.env.STRIPE_ONETIME_3_PLUS_DOGS_PRICE_ID || null,
    features: ['One-time service', '3+ dogs']
  }
];

// Initial cleanup plan
const initialCleanupPlan = {
  id: 'initial-cleanup',
  name: 'Initial Cleanup',
  description: 'One-time initial cleanup fee for new accounts',
  price: 32.00,
  frequency: 'one-time',
  serviceCount: 1,
  priceId: process.env.STRIPE_INITIAL_CLEANUP_PRICE_ID || null,
  features: ['Initial cleanup', 'One-time fee', 'Required for new accounts']
};

export async function GET() {
    // Safety check for client-side calls
    if (typeof window !== 'undefined') {
        return NextResponse.json({ error: 'This endpoint is server-side only' }, { status: 403 });
    }
    try {
        // If Stripe API key is not set, return default plans with real structure
        if (!process.env.STRIPE_SECRET_KEY) {
            console.warn('⚠️ STRIPE_SECRET_KEY is not set - returning default plans');
            const allPlans = [...defaultPlans, ...oneTimePlans, initialCleanupPlan];
            return NextResponse.json({ plans: allPlans });
        }
        
        // Check if Stripe instance is available
        if (!stripe) {
            console.warn('⚠️ Stripe instance not available - returning default plans');
            const allPlans = [...defaultPlans, ...oneTimePlans, initialCleanupPlan];
            return NextResponse.json({ plans: allPlans });
        }
        
        // Create a copy of all plans to populate with Stripe data
        const allPlans = [...defaultPlans, ...oneTimePlans, initialCleanupPlan];
        const updatedPlans = JSON.parse(JSON.stringify(allPlans));
        
        try {
            // Fetch all active products and their prices from Stripe
            const products = await stripe.products.list({
                active: true,
                expand: ['data.default_price'],
            });
            
            // Fetch all prices to get the most up-to-date ones
            const prices = await stripe.prices.list({
                active: true,
                expand: ['data.product'],
            });
            
            // Match Stripe products/prices with our plan types
            prices.data.forEach(price => {
                const product = price.product;
                // Skip if product is not expanded or has no metadata
                if (!product || !product.metadata) return;
                
                // Look for product type in metadata
                const productType = product.metadata.type;
                if (!productType) return;
                
                // Find the matching plan
                const planIndex = updatedPlans.findIndex(plan => plan.id === productType);
                if (planIndex === -1) return;
                
                // Update the plan with the Stripe data
                updatedPlans[planIndex].priceId = price.id;
                updatedPlans[planIndex].price = price.unit_amount ? price.unit_amount / 100 : updatedPlans[planIndex].price;
                
                // Add any extra metadata if available
                if (product.metadata.features) {
                    try {
                        updatedPlans[planIndex].features = JSON.parse(product.metadata.features);
                    } catch (e) {
                        // Keep default features if parsing fails
                    }
                }
            });
            
            return NextResponse.json({ plans: updatedPlans });
        } catch (stripeError) {
            console.error('Error fetching prices from Stripe:', stripeError);
            // In case of Stripe API error, fall back to default plans
            const allPlans = [...defaultPlans, ...oneTimePlans, initialCleanupPlan];
            return NextResponse.json({ plans: allPlans });
        }
    } catch (error) {
        console.error('Error in prices API:', error);
        // Return default plans in case of any other error
        const allPlans = [...defaultPlans, ...oneTimePlans, initialCleanupPlan];
        return NextResponse.json({ plans: allPlans });
    }
}
