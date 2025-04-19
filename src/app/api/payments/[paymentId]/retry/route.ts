import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: { paymentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId } = params;

    // Retrieve the payment from our database
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        customer: {
          include: { subscription: true }
        }
      }
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Only allow customer or admin to retry their own payments
    if (
      session.user.role !== UserRole.ADMIN &&
      payment.customerId !== session.user.customerId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if this payment is eligible for retry (failed status)
    if (payment.status !== 'FAILED') {
      return NextResponse.json(
        { error: 'Only failed payments can be retried' },
        { status: 400 }
      );
    }

    // Create a payment retry record
    const paymentRetry = await prisma.paymentRetry.create({
      data: {
        paymentId: payment.id,
        status: 'PENDING',
        retryCount: (payment.retries?.length || 0) + 1,
        nextRetryDate: new Date()
      }
    });

    // If we have a Stripe payment intent ID, we can retry the payment
    if (payment.stripePaymentIntentId) {
      // Get the customer's stripe ID
      const customerStripeId = payment.customer?.stripeCustomerId;
      
      if (!customerStripeId) {
        return NextResponse.json(
          { error: 'Customer has no Stripe account' },
          { status: 400 }
        );
      }

      // Create a new payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(payment.amount * 100), // Convert to cents
        currency: 'usd',
        customer: customerStripeId,
        description: `Retry payment for ${payment.id}`,
        setup_future_usage: 'off_session',
      });

      // Update the payment retry record
      await prisma.paymentRetry.update({
        where: { id: paymentRetry.id },
        data: {
          stripePaymentIntentId: paymentIntent.id
        }
      });

      return NextResponse.json({
        success: true,
        clientSecret: paymentIntent.client_secret
      });
    } else {
      // No stripe payment intent, we'll need to create one
      return NextResponse.json(
        { error: 'Cannot retry payment without original payment intent' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Payment retry error:', error);
    return NextResponse.json(
      { error: 'Failed to retry payment' },
      { status: 500 }
    );
  }
} 