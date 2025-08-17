import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuthUser } from '@/lib/api-auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user?.userId || user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer's Stripe ID
    const { prisma } = await import('@/lib/prisma');
    const customer = await prisma.customer.findUnique({
      where: { userId: user.userId },
      select: { stripeCustomerId: true }
    });

    if (!customer?.stripeCustomerId) {
      return NextResponse.json({ 
        error: 'No Stripe customer found. Please set up a payment method first.' 
      }, { status: 400 });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?tab=billing`,
    });

    return NextResponse.json({ 
      url: session.url 
    });

  } catch (error) {
    console.error('Error creating Stripe portal session:', error);
    return NextResponse.json({ 
      error: 'Failed to create portal session' 
    }, { status: 500 });
  }
}
