import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { plan, paymentMethodId } = await req.json();

    if (!plan || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Plan and payment method are required' },
        { status: 400 }
      );
    }

    // Get customer's Stripe ID or create one
    const customer = await prisma.customer.findUnique({
      where: { userId: decoded.userId },
      include: { user: true }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    let stripeCustomerId = customer.stripeCustomerId;

    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: customer.user.email,
        name: customer.user.name || undefined,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      stripeCustomerId = stripeCustomer.id;

      // Update customer with Stripe ID
      await prisma.customer.update({
        where: { id: customer.id },
        data: { stripeCustomerId }
      });
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: plan }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });

    // Create subscription record in database
    const dbSubscription = await prisma.subscription.create({
      data: {
        customerId: customer.id,
        plan,
        startDate: new Date(),
        nextBilling: new Date(subscription.current_period_end * 1000),
        status: 'ACTIVE',
        stripeSubscriptionId: subscription.id
      }
    });

    return NextResponse.json({
      subscription: dbSubscription,
      clientSecret: (subscription.latest_invoice as Stripe.Invoice).payment_intent?.client_secret
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 