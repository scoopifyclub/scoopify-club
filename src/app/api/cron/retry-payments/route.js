import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { stripe } from '@/lib/stripe';
import { logger } from '@/lib/logger';
import { withErrorHandler, ApiError, ErrorCode } from '@/lib/error-handler';
import { getEnv } from '@/lib/env-validator';
// Export runtime config for Next.js 15+
export const runtime = 'nodejs';
// Verify the CRON request is authentic
async function verifyCronRequest(request) {
    // Verify the request is from Vercel
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn('CRON job called without proper authorization header');
        throw new ApiError('Unauthorized', ErrorCode.UNAUTHORIZED);
    }
    // Split the header and verify the token
    const token = authHeader.split(' ')[1];
    try {
        // Get environment variables through our validator
        const env = getEnv();
        if (token !== env.CRON_SECRET) {
            logger.warn('CRON job called with invalid token');
            throw new ApiError('Invalid token', ErrorCode.UNAUTHORIZED);
        }
    }
    catch (error) {
        if (error instanceof ApiError)
            throw error;
        logger.error('Error verifying CRON token:', error);
        throw new ApiError('Error verifying authorization', ErrorCode.UNAUTHORIZED);
    }
}
// This function is triggered by a cron job to retry failed payments
export const GET = withErrorHandler(async (request) => {
    // Verify the request is legitimate
    await verifyCronRequest(request);
    logger.info('Starting scheduled payment retry process');
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
    const results = {
        total: paymentRetries.length,
        succeeded: 0,
        failed: 0,
        skipped: 0
    };
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
                results.skipped++;
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
                            status: 'ACTIVE'
                        }
                    });
                    logger.info(`Successfully retried payment ${retry.paymentId}`);
                }
                results.succeeded++;
            }
            else if (paymentIntent.status === 'requires_action') {
                // Payment requires customer action
                await prisma.paymentRetry.update({
                    where: { id: retry.id },
                    data: {
                        status: 'FAILED',
                        errorMessage: 'Payment requires customer action',
                        stripePaymentIntentId: paymentIntent.id
                    }
                });
                // Send notification to customer about required action
                if (retry.payment.customer && retry.payment.customer.email) {
                    try {
                        const { sendEmail } = await import('@/lib/email-service');
                        await sendEmail(
                            retry.payment.customer.email,
                            'Payment Action Required - Scoopify Club',
                            `Your payment of $${retry.payment.amount} requires action. Please update your payment method or contact support.`
                        );
                    } catch (emailError) {
                        console.error('Failed to send payment notification email:', emailError);
                    }
                }
                logger.info(`Payment ${retry.paymentId} requires customer action`);
                results.failed++;
            }
            else {
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
                }
                else {
                    // We've reached max retries, mark subscription as past_due or cancelled
                    if (retry.payment.subscriptionId) {
                        await prisma.subscription.update({
                            where: { id: retry.payment.subscriptionId },
                            data: {
                                status: 'PAST_DUE'
                            }
                        });
                        // Send notification to admin and customer about subscription payment failure
                        const customer = retry.payment.customer;
                        if (customer && customer.email) {
                            try {
                                const { sendEmail } = await import('@/lib/email-service');

                                // Notify customer
                                await sendEmail(
                                    customer.email,
                                    'Subscription Payment Failed - Scoopify Club',
                                    `Your subscription payment has failed. Please update your payment method to continue service.`
                                );

                                // Notify admin (you can customize the admin email)
                                const adminEmail = process.env.ADMIN_EMAIL || 'admin@scoopifyclub.com';
                                await sendEmail(
                                    adminEmail,
                                    'Subscription Payment Failure Alert',
                                    `Customer ${customer.email} has a failed subscription payment of $${retry.payment.amount}.`
                                );
                            } catch (emailError) {
                                console.error('Failed to send payment failure notifications:', emailError);
                            }
                        }
                    }
                }
                logger.info(`Failed to retry payment ${retry.paymentId} (attempt ${retry.retryCount})`);
                results.failed++;
            }
        }
        catch (error) {
            logger.error(`Error processing retry for payment ${retry.paymentId}:`, error);
            // Update retry record with error
            await prisma.paymentRetry.update({
                where: { id: retry.id },
                data: {
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            results.failed++;
        }
    }
    logger.info('Completed payment retry process', results);
    return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        results
    });
});
