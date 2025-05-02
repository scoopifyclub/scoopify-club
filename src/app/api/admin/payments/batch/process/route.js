import { requireRole } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { logPaymentEvent } from '@/lib/payment-audit';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email';
import { formatCurrency, formatDate } from '@/lib/utils';

// POST: Process a batch of payments
export async function POST(request) {
    try {
        const user = await requireRole('ADMIN');
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { payments } = await request.json();
        if (!payments || !Array.isArray(payments) || payments.length === 0) {
            return NextResponse.json(
                { error: 'No payments provided' },
                { status: 400 }
            );
        }

        // Create a new batch
        const batch = await prisma.paymentBatch.create({
            data: {
                status: 'PENDING',
                createdAt: new Date(),
            },
        });

        // Add payments to the batch
        const updatedPayments = await Promise.all(
            payments.map(async (paymentId) => {
                try {
                    const payment = await prisma.payment.update({
                        where: { id: paymentId },
                        data: {
                            batchId: batch.id,
                        },
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
                    });
                    return {
                        paymentId,
                        status: 'added',
                        payment,
                    };
                } catch (error) {
                    console.error(`Error adding payment ${paymentId} to batch:`, error);
                    return {
                        paymentId,
                        status: 'error',
                        error: error.message,
                    };
                }
            })
        );

        return NextResponse.json({
            batchId: batch.id,
            results: updatedPayments,
        });
    } catch (error) {
        console.error('Error creating payment batch:', error);
        return NextResponse.json(
            { error: 'Failed to create payment batch' },
            { status: 500 }
        );
    }
}
