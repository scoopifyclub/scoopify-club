import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET() {
  try {
    // Test the Stripe connection by listing products
    const products = await stripe.products.list({ limit: 1 });
    
    return NextResponse.json({
      success: true,
      message: 'Stripe connection successful',
      hasProducts: products.data.length > 0
    });
  } catch (error) {
    console.error('Stripe test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect to Stripe',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 