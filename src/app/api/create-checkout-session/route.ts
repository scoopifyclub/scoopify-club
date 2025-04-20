import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: Request) {
  if (typeof window !== 'undefined') {
    return NextResponse.json({ error: 'This endpoint is server-side only' }, { status: 403 });
  }

  try {
    const { priceId, isOneTime } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // Check if we're using a placeholder price ID (development/demo mode)
    if (priceId.includes('price_placeholder')) {
      return NextResponse.json(
        { error: 'Placeholder prices cannot be used for checkout' },
        { status: 400 }
      );
    }

    // Check if Stripe is properly configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not properly configured' },
        { status: 500 }
      );
    }

    // Get the absolute URL for success and cancel URLs
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    
    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isOneTime ? 'payment' : 'subscription',
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      metadata: {
        isOneTime: isOneTime ? 'true' : 'false',
      }
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
} 