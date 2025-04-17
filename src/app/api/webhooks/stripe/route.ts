import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { addDays } from 'date-fns';

// Import service configurations
import { SUBSCRIPTION_PLANS, ONE_TIME_SERVICES } from '@/lib/constants';

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature || !endpointSecret) {
    return NextResponse.json(
      { error: 'Missing stripe signature or webhook secret' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'setup_intent.succeeded': {
        const setupIntent = event.data.object;
        const userId = setupIntent.metadata.userId;

        if (!userId) {
          throw new Error('No userId found in setup intent metadata');
        }

        // Get the customer's subscription details
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            customer: {
              include: {
                subscription: true
              }
            }
          }
        });

        if (!user?.customer?.subscription) {
          throw new Error('No subscription found for user');
        }

        const subscription = user.customer.subscription;
        const isOneTimeService = subscription.frequency === 'ONE_TIME';

        if (isOneTimeService) {
          // For one-time service, create a payment intent
          const paymentIntent = await stripe.paymentIntents.create({
            customer: user.customer.stripeCustomerId,
            setup_future_usage: 'off_session',
            amount: subscription.pricePerVisit * 100, // Convert to cents
            currency: 'usd',
            metadata: {
              userId,
              customerId: user.customer.id,
              serviceType: 'ONE_TIME'
            }
          });

          // Update the subscription status
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'ACTIVE',
              stripeSubscriptionId: paymentIntent.id
            },
          });

          // Create the one-time service
          await prisma.service.create({
            data: {
              customerId: user.customer.id,
              scheduledFor: new Date(subscription.startDate),
              status: 'SCHEDULED',
              type: 'ONE_TIME',
              amount: subscription.pricePerVisit,
            },
          });
        } else {
          // For regular service, create monthly subscription
          const stripeSubscription = await stripe.subscriptions.create({
            customer: user.customer.stripeCustomerId,
            items: [{
              price_data: {
                currency: 'usd',
                product_data: {
                  name: 'Monthly Lawn Service',
                },
                unit_amount: subscription.pricePerVisit * 100, // Monthly price
                recurring: {
                  interval: 'month',
                },
              },
            }],
            metadata: {
              userId,
              customerId: user.customer.id,
            },
          });

          // Update the subscription in our database
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              stripeSubscriptionId: stripeSubscription.id,
              status: 'ACTIVE',
              startDate: new Date(stripeSubscription.current_period_start * 1000),
              nextBillingDate: new Date(stripeSubscription.current_period_end * 1000),
            },
          });

          // Schedule weekly services for the next month
          const serviceDate = new Date(subscription.startDate);
          const services = [];

          // Schedule 4 weeks of services
          for (let i = 0; i < 4; i++) {
            const nextServiceDate = new Date(serviceDate);
            nextServiceDate.setDate(serviceDate.getDate() + (i * 7));

            services.push({
              customerId: user.customer.id,
              scheduledFor: nextServiceDate,
              status: 'SCHEDULED',
              type: 'REGULAR',
              amount: subscription.pricePerVisit,
            });
          }

          // Create all future services
          await prisma.service.createMany({
            data: services,
          });
        }

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        if (!subscriptionId) {
          break;
        }

        // Get the subscription from our database
        const dbSubscription = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscriptionId as string },
          include: {
            customer: true
          }
        });

        if (!dbSubscription) {
          break;
        }

        // Update the subscription's next billing date
        await prisma.subscription.update({
          where: { id: dbSubscription.id },
          data: {
            nextBillingDate: new Date(invoice.period_end * 1000),
          },
        });

        // Schedule next month's services
        const nextMonthServices = [];
        const startDate = new Date(invoice.period_end * 1000);

        // Schedule 4 weeks of services
        for (let i = 0; i < 4; i++) {
          const serviceDate = new Date(startDate);
          serviceDate.setDate(startDate.getDate() + (i * 7));

          nextMonthServices.push({
            customerId: dbSubscription.customerId,
            scheduledFor: serviceDate,
            status: 'SCHEDULED',
            type: 'REGULAR',
            amount: dbSubscription.pricePerVisit,
          });
        }

        // Create next month's services
        await prisma.service.createMany({
          data: nextMonthServices,
        });

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

        // Update the subscription status in our database
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'CANCELLED',
          },
        });

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
} 