import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPaymentRetryEmail } from '@/lib/email-service';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }
        const now = new Date();
        const retries = await prisma.paymentRetry.findMany({
            where: {
                status: 'SCHEDULED',
                scheduledDate: {
                    lte: now
                }
            },
            include: {
                payment: {
                    include: {
                        subscription: {
                            include: {
                                customer: {
                                    include: {
                                        user: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        for (const retry of retries) {
            try {
                // Send retry notification
                await sendPaymentRetryEmail(retry.payment.subscription.customer.user.email, retry.payment.subscription.customer.name);
                // Process the payment retry
                const paymentResult = await processPaymentRetry(retry);
                
                if (paymentResult.success) {
                    // Update retry status to successful
                    await prisma.paymentRetry.update({
                        where: { id: retry.id },
                        data: {
                            status: 'SUCCESS',
                            processedAt: new Date(),
                            result: paymentResult
                        }
                    });
                } else {
                    // Update retry status to failed
                    await prisma.paymentRetry.update({
                        where: { id: retry.id },
                        data: {
                            status: 'FAILED',
                            processedAt: new Date(),
                            result: paymentResult,
                            failureReason: paymentResult.error || 'Unknown error'
                        }
                    });
                }
            }
            catch (error) {
                console.error('Error processing payment retry:', error);
                await prisma.paymentRetry.update({
                    where: { id: retry.id },
                    data: { status: 'FAILED' }
                });
            }
        }
        return NextResponse.json({ processed: retries.length });
    }
    catch (error) {
        console.error('Error in payment retry cron job:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// Helper function to process payment retry
async function processPaymentRetry(retry) {
    try {
        // Get the payment details
        const payment = await prisma.payment.findUnique({
            where: { id: retry.paymentId },
            include: {
                subscription: {
                    include: {
                        customer: {
                            include: {
                                user: true
                            }
                        }
                    }
                }
            }
        });

        if (!payment) {
            return { success: false, error: 'Payment not found' };
        }

        // Attempt to charge the customer again
        // This would integrate with your payment processor (Stripe, etc.)
        // For now, we'll simulate a successful retry
        const retryResult = await attemptPaymentRetry(payment);
        
        return retryResult;
    } catch (error) {
        console.error('Error processing payment retry:', error);
        return { success: false, error: error.message };
    }
}

// Simulate payment retry attempt
async function attemptPaymentRetry(payment) {
    // This is where you'd integrate with Stripe or your payment processor
    // For now, we'll simulate a 70% success rate
    const isSuccess = Math.random() > 0.3;
    
    if (isSuccess) {
        return { success: true, message: 'Payment retry successful' };
    } else {
        return { success: false, error: 'Payment method declined' };
    }
}
