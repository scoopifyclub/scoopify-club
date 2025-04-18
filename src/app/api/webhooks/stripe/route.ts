import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import Stripe from 'stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await prisma.customer.findUnique({
          where: { stripeCustomerId: subscription.customer as string },
          include: { subscription: true }
        });

        if (customer) {
          await prisma.subscription.update({
            where: { id: customer.subscription?.id },
            data: {
              status: subscription.status,
              stripeSubscriptionId: subscription.id,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000)
            }
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await prisma.customer.findUnique({
          where: { stripeCustomerId: subscription.customer as string },
          include: { subscription: true }
        });

        if (customer) {
          await prisma.subscription.update({
            where: { id: customer.subscription?.id },
            data: {
              status: 'CANCELLED',
              stripeSubscriptionId: subscription.id
            }
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customer = await prisma.customer.findUnique({
          where: { stripeCustomerId: invoice.customer as string },
          include: { subscription: true }
        });

        if (customer) {
          // Create payment record
          await prisma.payment.create({
            data: {
              amount: invoice.amount_paid / 100, // Convert from cents to dollars
              status: 'COMPLETED',
              method: 'STRIPE',
              subscriptionId: customer.subscription?.id,
              stripePaymentIntentId: invoice.payment_intent as string,
              stripeInvoiceId: invoice.id
            }
          });

          // If this is the first payment, check for referral
          if (customer.referralCode) {
            const referrer = await prisma.customer.findFirst({
              where: { referralCode: customer.referralCode }
            });

            if (referrer) {
              // Add referral credit
              await prisma.referral.create({
                data: {
                  referrerId: referrer.id,
                  referredId: customer.id,
                  amount: 10, // $10 referral credit
                  status: 'COMPLETED'
                }
              });
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customer = await prisma.customer.findUnique({
          where: { stripeCustomerId: invoice.customer as string },
          include: { subscription: true }
        });

        if (customer) {
          await prisma.payment.create({
            data: {
              amount: invoice.amount_due / 100,
              status: 'FAILED',
              method: 'STRIPE',
              subscriptionId: customer.subscription?.id,
              stripePaymentIntentId: invoice.payment_intent as string,
              stripeInvoiceId: invoice.id
            }
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
} 