import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET() {
  try {
    const prices = await stripe.prices.list({
      expand: ['data.product'],
      active: true,
    });

    const plans = prices.data.map((price) => ({
      id: price.id,
      name: (price.product as any).name,
      description: (price.product as any).description,
      price: price.unit_amount,
      currency: price.currency,
      interval: price.recurring?.interval,
      intervalCount: price.recurring?.interval_count,
    }));

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Plans error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
} 