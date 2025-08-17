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

    const { prisma } = await import('@/lib/prisma');
    
    // Get or create customer
    let customer = await prisma.customer.findUnique({
      where: { userId: user.userId },
      select: { id: true, stripeCustomerId: true }
    });

    let stripeCustomerId = customer?.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.userId,
          customerId: customer?.id
        }
      });

      stripeCustomerId = stripeCustomer.id;

      // Update customer record with Stripe ID
      if (customer) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { stripeCustomerId }
        });
      } else {
        // Create customer record if doesn't exist
        customer = await prisma.customer.create({
          data: {
            userId: user.userId,
            stripeCustomerId
          }
        });
      }
    }

    // Create setup intent for adding payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session', // Allow future payments without customer interaction
      metadata: {
        customerId: customer.id,
        userId: user.userId
      }
    });

    return NextResponse.json({ 
      clientSecret: setupIntent.client_secret,
      customerId: stripeCustomerId
    });

  } catch (error) {
    console.error('Error creating setup intent:', error);
    return NextResponse.json({ 
      error: 'Failed to create setup intent' 
    }, { status: 500 });
  }
}
