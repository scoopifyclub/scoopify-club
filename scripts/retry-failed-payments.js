// scripts/retry-failed-payments.js
// This script runs as a cron job to retry failed payments
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();
// Load environment variables from .env.local (overrides .env)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Check if Stripe key is loaded correctly
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is not defined in environment variables.');
  console.error('Make sure you have a valid key in your .env.local file.');
  process.exit(1);
}

const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
const { logger } = require('../src/lib/logger');

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function retryFailedPayments() {
  try {
    logger.info('Starting failed payment retry process');
    logger.info(`Using Stripe API Key: ${process.env.STRIPE_SECRET_KEY.substring(0, 7)}...${process.env.STRIPE_SECRET_KEY.substring(process.env.STRIPE_SECRET_KEY.length - 4)}`);

    // Get all scheduled payment retries that are due
    const paymentRetries = await prisma.paymentRetry.findMany({
      where: {
        status: 'SCHEDULED',
        nextRetryDate: {
          lte: new Date() // Due now or in the past
        }
      },
      include: {
        payment: {
          include: {
            customer: true
          }
        }
      }
    });

    logger.info(`Found ${paymentRetries.length} failed payments to retry`);

    for (const retry of paymentRetries) {
      try {
        // Update retry status to pending
        await prisma.paymentRetry.update({
          where: { id: retry.id },
          data: { status: 'PENDING' }
        });
        
        // Skip if no customer found or no Stripe ID
        if (!retry.payment.customer || !retry.payment.customer.stripeCustomerId) {
          logger.error(`No customer or Stripe ID for payment ${retry.paymentId}`);
          await prisma.paymentRetry.update({
            where: { id: retry.id },
            data: {
              status: 'FAILED',
              errorMessage: 'No customer or Stripe ID found'
            }
          });
          continue;
        }

        // Create a new payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(retry.payment.amount * 100), // Convert to cents
          currency: 'usd',
          customer: retry.payment.customer.stripeCustomerId,
          payment_method_types: ['card'],
          off_session: true,
          confirm: true,
          description: `Retry payment for ${retry.paymentId}`,
        });

        // Update retry record based on payment intent status
        if (paymentIntent.status === 'succeeded') {
          // Payment succeeded
          await prisma.paymentRetry.update({
            where: { id: retry.id },
            data: {
              status: 'SUCCESS',
              stripePaymentIntentId: paymentIntent.id
            }
          });

          // Update the original payment record
          await prisma.payment.update({
            where: { id: retry.paymentId },
            data: {
              status: 'COMPLETED',
              updatedAt: new Date()
            }
          });

          // If this was a subscription payment, update subscription status
          if (retry.payment.subscriptionId) {
            await prisma.subscription.update({
              where: { id: retry.payment.subscriptionId },
              data: {
                status: 'ACTIVE',
                lastPaymentDate: new Date()
              }
            });
          }

          logger.info(`Successfully retried payment ${retry.paymentId}`);
        } else if (paymentIntent.status === 'requires_action') {
          // Payment requires customer action
          await prisma.paymentRetry.update({
            where: { id: retry.id },
            data: {
              status: 'FAILED',
              errorMessage: 'Payment requires customer action',
              stripePaymentIntentId: paymentIntent.id
            }
          });

          // TODO: Send notification to customer about required action

          logger.info(`Payment ${retry.paymentId} requires customer action`);
        } else {
          // Payment failed
          await prisma.paymentRetry.update({
            where: { id: retry.id },
            data: {
              status: 'FAILED',
              errorMessage: `Payment failed with status: ${paymentIntent.status}`,
              stripePaymentIntentId: paymentIntent.id
            }
          });

          // Schedule another retry if we haven't reached max retries (3)
          if (retry.retryCount < 3) {
            await prisma.paymentRetry.create({
              data: {
                paymentId: retry.paymentId,
                status: 'SCHEDULED',
                retryCount: retry.retryCount + 1,
                nextRetryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days later
              }
            });
          } else {
            // We've reached max retries, mark subscription as past_due or cancelled
            if (retry.payment.subscriptionId) {
              await prisma.subscription.update({
                where: { id: retry.payment.subscriptionId },
                data: {
                  status: 'PAST_DUE'
                }
              });
              
              // TODO: Send notification to admin and customer about subscription payment failure
            }
          }

          logger.info(`Failed to retry payment ${retry.paymentId} (attempt ${retry.retryCount})`);
        }
      } catch (error) {
        logger.error(`Error processing retry for payment ${retry.paymentId}:`, error);
        
        // Update retry record with error
        await prisma.paymentRetry.update({
          where: { id: retry.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message
          }
        });
      }
    }

    logger.info('Completed failed payment retry process');
  } catch (error) {
    logger.error('Error in payment retry process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
retryFailedPayments()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('Fatal error in retry script:', error);
    process.exit(1);
  }); 