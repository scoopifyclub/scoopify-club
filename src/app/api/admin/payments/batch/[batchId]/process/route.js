import { requireRole } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


// POST /api/admin/payments/batch/[batchId]/process
// Process all payments in a batch
export async function POST(request, { params }) {
    try {
        const user = await requireRole('ADMIN');
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { batchId } = params;
        if (!batchId) {
            return NextResponse.json(
                { error: 'Batch ID is required' },
                { status: 400 }
            );
        }

        const batch = await prisma.paymentBatch.findUnique({
            where: { id: batchId },
            include: {
                payments: {
                    include: {
                        service: {
                            include: {
                                customer: {
                                    include: {
                                        user: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!batch) {
            return NextResponse.json(
                { error: 'Batch not found' },
                { status: 404 }
            );
        }

        if (batch.status !== 'PENDING') {
            return NextResponse.json(
                { error: 'Batch is not in pending status' },
                { status: 400 }
            );
        }

        // Process each payment in the batch
        const results = await Promise.all(
            batch.payments.map(async (payment) => {
                try {
                    if (payment.paymentMethod === 'STRIPE' && payment.service?.customer?.stripeCustomerId) {
                        const paymentIntent = await stripe.paymentIntents.create({
                            amount: Math.round(payment.amount * 100),
                            currency: 'usd',
                            customer: payment.service.customer.stripeCustomerId,
                            payment_method: payment.service.customer.defaultPaymentMethodId,
                            off_session: true,
                            confirm: true,
                        });

                        await prisma.payment.update({
                            where: { id: payment.id },
                            data: {
                                status: 'PAID',
                                stripePaymentIntentId: paymentIntent.id,
                                paidAt: new Date(),
                            },
                        });

                        return {
                            paymentId: payment.id,
                            status: 'success',
                            stripePaymentIntentId: paymentIntent.id,
                        };
                    }

                    return {
                        paymentId: payment.id,
                        status: 'skipped',
                        reason: 'Not a Stripe payment or missing customer info',
                    };
                } catch (error) {
                    console.error(`Error processing payment ${payment.id}:`, error);
                    return {
                        paymentId: payment.id,
                        status: 'error',
                        error: error.message,
                    };
                }
            })
        );

        // Update batch status
        await prisma.paymentBatch.update({
            where: { id: batchId },
            data: {
                status: 'PROCESSED',
                processedAt: new Date(),
            },
        });

        return NextResponse.json({
            batchId,
            results,
        });
    } catch (error) {
        console.error('Error processing batch:', error);
        return NextResponse.json(
            { error: 'Failed to process batch' },
            { status: 500 }
        );
    }
}
