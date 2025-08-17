import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { addWeeks, startOfWeek } from 'date-fns';
import { logWebhookProcessed, logWebhookFailed, logSecurityCritical } from '@/lib/payment-logging';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');
    const clientIP = headersList.get('x-forwarded-for') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Log webhook attempt for security monitoring
    console.log(`[WEBHOOK] Received webhook from IP: ${clientIP}, User-Agent: ${userAgent}`);

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      
      // Log security event for monitoring
      await logSecurityCritical({
        eventType: 'webhook_signature_failed',
        description: `Webhook signature verification failed: ${err.message}`,
        ipAddress: clientIP,
        userAgent: userAgent,
        metadata: {
          error: err.message,
          webhookSecret: webhookSecret ? 'present' : 'missing'
        }
      });
      
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Processing webhook event:', event.type);

    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await handleInvoicePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event.data.object);
          break;

        case 'customer.subscription.created':
          await handleSubscriptionCreated(event.data.object);
          break;

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object);
          break;

        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object);
          break;

        case 'customer.updated':
          await handleCustomerUpdated(event.data.object);
          break;

        case 'payment_method.attached':
          await handlePaymentMethodAttached(event.data.object);
          break;

        case 'payment_method.detached':
          await handlePaymentMethodDetached(event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Log successful webhook processing
      await logWebhookProcessed({
        eventType: event.type,
        stripeEventId: event.id,
        ipAddress: clientIP,
        userAgent: userAgent,
        metadata: {
          eventId: event.id,
          objectId: event.data.object.id
        }
      });

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook event:', error);
      
      // Log webhook processing failure
      await logWebhookFailed({
        eventType: event.type,
        stripeEventId: event.id,
        errorMessage: error.message,
        ipAddress: clientIP,
        userAgent: userAgent,
        metadata: {
          eventId: event.id,
          objectId: event.data.object.id,
          error: error.message
        }
      });

      return NextResponse.json(
        { error: 'Webhook handler failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  try {
    console.log('Processing successful invoice payment:', invoice.id);

    // Find the subscription in our database
    const subscription = await prisma.subscription.findFirst({
      where: {
        stripeSubscriptionId: invoice.subscription
      },
      include: {
        customer: {
          include: {
            user: true
          }
        }
      }
    });

    if (!subscription) {
      console.log('Subscription not found for invoice:', invoice.id);
      return;
    }

    // Update subscription status and next billing date
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        nextBillingDate: new Date(invoice.next_payment_attempt * 1000),
        lastBillingDate: new Date()
      }
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        customerId: subscription.customerId,
        amount: invoice.amount_paid / 100, // Convert from cents
        status: 'COMPLETED',
        stripeInvoiceId: invoice.id,
        stripePaymentIntentId: invoice.payment_intent,
        type: 'SUBSCRIPTION_RENEWAL'
      }
    });

    // Create services for the next billing period
    await createServicesForSubscription(subscription.id);

    console.log(`Successfully processed payment for subscription ${subscription.id}`);
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  try {
    console.log('Processing failed invoice payment:', invoice.id);

    const subscription = await prisma.subscription.findFirst({
      where: {
        stripeSubscriptionId: invoice.subscription
      },
      include: {
        customer: {
          include: {
            user: true
          }
        }
      }
    });

    if (!subscription) {
      console.log('Subscription not found for failed invoice:', invoice.id);
      return;
    }

    // Update subscription status based on Stripe's retry schedule
    let status = 'PAST_DUE';
    let nextBilling = null;
    
    if (invoice.next_payment_attempt) {
      nextBilling = new Date(invoice.next_payment_attempt * 1000);
    } else if (invoice.attempt_count >= 3) {
      // After 3 failed attempts, mark as cancelled
      status = 'CANCELLED';
      nextBilling = null;
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: status,
        nextBilling: nextBilling
      }
    });

    // Create failed payment record
    await prisma.payment.create({
      data: {
        customerId: subscription.customerId,
        amount: invoice.amount_due / 100,
        status: 'FAILED',
        stripeInvoiceId: invoice.id,
        type: 'SUBSCRIPTION_RENEWAL',
        notes: `Payment failed. Attempt ${invoice.attempt_count || 1} of 3.`
      }
    });

    // Send notification to customer about failed payment
    await sendPaymentFailedNotification(subscription.customer, invoice);

    console.log(`Processed failed payment for subscription ${subscription.id}, status: ${status}`);
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}

async function handleSubscriptionCreated(subscription) {
  try {
    console.log('Processing new subscription:', subscription.id);

    // Find customer by Stripe customer ID
    const customer = await prisma.customer.findFirst({
      where: {
        stripeCustomerId: subscription.customer
      }
    });

    if (!customer) {
      console.log('Customer not found for subscription:', subscription.id);
      return;
    }

    // Create subscription record
    const dbSubscription = await prisma.subscription.create({
      data: {
        customerId: customer.id,
        stripeSubscriptionId: subscription.id,
        status: 'ACTIVE',
        startDate: new Date(subscription.current_period_start * 1000),
        endDate: new Date(subscription.current_period_end * 1000),
        nextBillingDate: new Date(subscription.current_period_end * 1000)
      }
    });

    // Create initial services for the subscription period
    await createServicesForSubscription(dbSubscription.id);

    console.log(`Created subscription ${dbSubscription.id} for customer ${customer.id}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    console.log('Processing subscription update:', subscription.id);

    const dbSubscription = await prisma.subscription.findFirst({
      where: {
        stripeSubscriptionId: subscription.id
      }
    });

    if (!dbSubscription) {
      console.log('Subscription not found for update:', subscription.id);
      return;
    }

    // Update subscription status
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: subscription.status === 'active' ? 'ACTIVE' : 'CANCELLED',
        endDate: subscription.cancel_at_period_end ? 
          new Date(subscription.current_period_end * 1000) : null,
        nextBillingDate: new Date(subscription.current_period_end * 1000)
      }
    });

    console.log(`Updated subscription ${dbSubscription.id}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    console.log('Processing subscription deletion:', subscription.id);

    const dbSubscription = await prisma.subscription.findFirst({
      where: {
        stripeSubscriptionId: subscription.id
      }
    });

    if (!dbSubscription) {
      console.log('Subscription not found for deletion:', subscription.id);
      return;
    }

    // Cancel subscription
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: 'CANCELLED',
        endDate: new Date()
      }
    });

    // Cancel any pending services
    await prisma.service.updateMany({
      where: {
        subscriptionId: dbSubscription.id,
        status: 'SCHEDULED'
      },
      data: {
        status: 'CANCELLED'
      }
    });

    console.log(`Cancelled subscription ${dbSubscription.id}`);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    console.log('Processing successful payment intent:', paymentIntent.id);

    // Handle one-time payments (not subscription renewals)
    if (paymentIntent.metadata?.type === 'one_time_payment') {
      const customer = await prisma.customer.findFirst({
        where: {
          stripeCustomerId: paymentIntent.customer
        }
      });

      if (customer) {
        await prisma.payment.create({
          data: {
            customerId: customer.id,
            amount: paymentIntent.amount / 100,
            status: 'COMPLETED',
            stripePaymentIntentId: paymentIntent.id,
            type: 'ONE_TIME_PAYMENT'
          }
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    console.log('Processing failed payment intent:', paymentIntent.id);

    const customer = await prisma.customer.findFirst({
      where: {
        stripeCustomerId: paymentIntent.customer
      }
    });

    if (customer) {
      await prisma.payment.create({
        data: {
          customerId: customer.id,
          amount: paymentIntent.amount / 100,
          status: 'FAILED',
          stripePaymentIntentId: paymentIntent.id,
          type: 'ONE_TIME_PAYMENT'
        }
      });
    }
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

async function createServicesForSubscription(subscriptionId) {
  try {
    const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: {
            customer: true,
            servicePlan: true
        }
    });

    if (!subscription) return;

    // Create 4 weekly services for the subscription period
    const startDate = new Date(subscription.startDate);
    
    for (let week = 0; week < 4; week++) {
      const serviceDate = addWeeks(startDate, week);
      const weekStart = startOfWeek(serviceDate, { weekStartsOn: 1 }); // Monday

      // Check if service already exists
      const existingService = await prisma.service.findFirst({
        where: {
          subscriptionId: subscriptionId,
          scheduledDate: {
            gte: weekStart,
            lt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        }
      });

      if (!existingService) {
        // Calculate potential earnings
        const subscriptionAmount = subscription.servicePlan.price;
        const stripeFee = subscriptionAmount * 0.029 + 0.30;
        const netAmount = subscriptionAmount - stripeFee;
        const potentialEarnings = Math.round((netAmount * 0.75) * 100) / 100;

        await prisma.service.create({
          data: {
            customerId: subscription.customerId,
            servicePlanId: subscription.servicePlanId,
            scheduledDate: weekStart,
            status: 'SCHEDULED',
            potentialEarnings,
            subscriptionId: subscriptionId,
            notes: `Auto-generated service for subscription ${subscriptionId}`
          }
        });
      }
    }
  } catch (error) {
    console.error('Error creating services for subscription:', error);
  }
}

async function sendPaymentFailedNotification(customer, invoice) {
  try {
    // This would integrate with your email/SMS service
    console.log(`Sending payment failed notification to ${customer.user.email}`);
    
    // Example email integration:
    // await sendEmail({
    //   to: customer.user.email,
    //   subject: 'Payment Failed - Action Required',
    //   template: 'payment-failed',
    //   data: { 
    //     customerName: customer.user.name,
    //     amount: invoice.amount_due / 100,
    //     attemptCount: invoice.attempt_count || 1,
    //     nextAttempt: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000) : null
    //   }
    // });
  } catch (error) {
    console.error('Error sending payment failed notification:', error);
  }
}

async function handleCustomerUpdated(customer) {
  try {
    console.log('Processing customer update:', customer.id);

    // Update customer metadata in our database if needed
    const dbCustomer = await prisma.customer.findFirst({
      where: { stripeCustomerId: customer.id }
    });

    if (dbCustomer) {
      await prisma.customer.update({
        where: { id: dbCustomer.id },
        data: {
          updatedAt: new Date()
        }
      });
    }
  } catch (error) {
    console.error('Error handling customer updated:', error);
  }
}

async function handlePaymentMethodAttached(paymentMethod) {
  try {
    console.log('Processing payment method attached:', paymentMethod.id);

    // Update customer's default payment method if this is the new default
    if (paymentMethod.customer) {
      const dbCustomer = await prisma.customer.findFirst({
        where: { stripeCustomerId: paymentMethod.customer }
      });

      if (dbCustomer) {
        // Log the payment method attachment
        console.log(`Payment method ${paymentMethod.id} attached to customer ${dbCustomer.id}`);
      }
    }
  } catch (error) {
    console.error('Error handling payment method attached:', error);
  }
}

async function handlePaymentMethodDetached(paymentMethod) {
  try {
    console.log('Processing payment method detached:', paymentMethod.id);

    // Handle payment method removal
    if (paymentMethod.customer) {
      const dbCustomer = await prisma.customer.findFirst({
        where: { stripeCustomerId: paymentMethod.customer }
      });

      if (dbCustomer) {
        console.log(`Payment method ${paymentMethod.id} detached from customer ${dbCustomer.id}`);
        
        // Check if this was the default payment method
        // If so, you might want to notify the customer to add a new one
      }
    }
  } catch (error) {
    console.error('Error handling payment method detached:', error);
  }
}
