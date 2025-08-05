import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPaymentRetryEmail } from '@/lib/email';
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
                // Here you would implement your actual payment retry logic
                // const paymentResult = await processPayment(retry.payment);
                const paymentResult = { success: false }; // Placeholder
                if (paymentResult.success) {
                    // Update payment status
                    await prisma.payment.update({
                        where: { id: retry.paymentId },
                        data: { status: 'SUCCEEDED' }
                    });
                    // Update customer status
                    await prisma.customer.update({
                        where: { id: retry.payment.subscription.customerId },
                        data: { status: 'ACTIVE' }
                    });
                    await prisma.paymentRetry.update({
                        where: { id: retry.id },
                        data: { status: 'COMPLETED' }
                    });
                }
                else {
                    // Calculate next retry date (increasing interval)
                    const nextAttempt = retry.attemptNumber + 1;
                    const daysToAdd = Math.min(3 * nextAttempt, 30); // Max 30 days
                    const nextRetryDate = new Date();
                    nextRetryDate.setDate(nextRetryDate.getDate() + daysToAdd);
                    // Create new retry attempt
                    await prisma.paymentRetry.create({
                        data: {
                            paymentId: retry.paymentId,
                            scheduledDate: nextRetryDate,
                            attemptNumber: nextAttempt,
                            status: 'SCHEDULED'
                        }
                    });
                    // Mark current retry as failed
                    await prisma.paymentRetry.update({
                        where: { id: retry.id },
                        data: { status: 'FAILED' }
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
