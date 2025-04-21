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

// Create default plans structure with placeholder price IDs
const defaultPlans = [
  {
    name: 'Single Dog',
    price: 55.00,
    interval: 'month',
    serviceFrequency: 'Weekly',
    numberOfDogs: 1,
    priceId: 'price_placeholder_single_dog',
    features: [
      'Weekly yard cleaning',
      '1 dog',
      'Priority scheduling',
      'Email notifications',
      'Photo verification',
      'Monthly billing',
    ],
    popular: false,
    type: PRICE_TYPES.SINGLE_DOG,
  },
  {
    name: 'Two Dogs',
    price: 70.00,
    interval: 'month',
    serviceFrequency: 'Weekly',
    numberOfDogs: 2,
    priceId: 'price_placeholder_two_dogs',
    features: [
      'Weekly yard cleaning',
      '2 dogs',
      'Priority scheduling',
      'Email notifications',
      'Photo verification',
      'Monthly billing',
    ],
    popular: true,
    type: PRICE_TYPES.TWO_DOGS,
  },
  {
    name: 'Three+ Dogs',
    price: 100.00,
    interval: 'month',
    serviceFrequency: 'Weekly',
    numberOfDogs: '3+',
    priceId: 'price_placeholder_three_plus_dogs',
    features: [
      'Weekly yard cleaning',
      '3 or more dogs',
      'Priority scheduling',
      'Email notifications',
      'Photo verification',
      'Monthly billing',
    ],
    popular: false,
    type: PRICE_TYPES.THREE_PLUS_DOGS,
  },
  {
    name: 'One-Time Cleanup (1 Dog)',
    price: 75.00,
    interval: 'one-time',
    serviceFrequency: 'Single Visit',
    numberOfDogs: 1,
    priceId: 'price_placeholder_one_time_single_dog',
    features: [
      'Single yard cleaning',
      '1 dog',
      'Choose your preferred day',
      'Email confirmation',
      'Photo verification',
      'No subscription required',
    ],
    popular: false,
    type: PRICE_TYPES.ONE_TIME_SINGLE_DOG,
  },
  {
    name: 'One-Time Cleanup (2 Dogs)',
    price: 90.00,
    interval: 'one-time',
    serviceFrequency: 'Single Visit',
    numberOfDogs: 2,
    priceId: 'price_placeholder_one_time_two_dogs',
    features: [
      'Single yard cleaning',
      '2 dogs',
      'Choose your preferred day',
      'Email confirmation',
      'Photo verification',
      'No subscription required',
    ],
    popular: false,
    type: PRICE_TYPES.ONE_TIME_TWO_DOGS,
  },
  {
    name: 'One-Time Cleanup (3+ Dogs)',
    price: 120.00,
    interval: 'one-time',
    serviceFrequency: 'Single Visit',
    numberOfDogs: '3+',
    priceId: 'price_placeholder_one_time_three_plus_dogs',
    features: [
      'Single yard cleaning',
      '3 or more dogs',
      'Choose your preferred day',
      'Email confirmation',
      'Photo verification',
      'No subscription required',
    ],
    popular: false,
    type: PRICE_TYPES.ONE_TIME_THREE_PLUS_DOGS,
  },
];

export async function GET() {
  // Safety check for client-side calls
  if (typeof window !== 'undefined') {
    return NextResponse.json({ error: 'This endpoint is server-side only' }, { status: 403 });
  }

  try {
    // If Stripe API key is not set, return default plans with placeholder IDs
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('⚠️ STRIPE_SECRET_KEY is not set - returning placeholder prices');
      return NextResponse.json({ plans: defaultPlans });
    }

    // Check if Stripe instance is available
    if (!stripe) {
      console.warn('⚠️ Stripe instance not available - returning placeholder prices');
      return NextResponse.json({ plans: defaultPlans });
    }
    
    // Create a copy of default plans to populate with Stripe data
    const updatedPlans = JSON.parse(JSON.stringify(defaultPlans));
    
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
        const product = price.product as any;
        
        // Skip if product is not expanded or has no metadata
        if (!product || !product.metadata) return;
        
        // Look for product type in metadata
        const productType = product.metadata.type;
        if (!productType) return;
        
        // Find the matching plan
        const planIndex = updatedPlans.findIndex(plan => plan.type === productType);
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
      // In case of Stripe API error, fall back to default placeholder prices
      return NextResponse.json({ plans: defaultPlans });
    }
  } catch (error) {
    console.error('Error in prices API:', error);
    // Return default plans in case of any other error
    return NextResponse.json({ plans: defaultPlans });
  }
} 