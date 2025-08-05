import { requireRole } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { logPaymentEvent } from '@/lib/payment-audit';
import { logger } from '@/lib/logger';

export async function POST(request, { params }) {
    try {
        const user = await requireRole('ADMIN');
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { paymentId } = params;
        if (!paymentId) {
            return NextResponse.json(
                { error: 'Payment ID is required' },
                { status: 400 }
            );
        }

        const { reason } = await request.json();
        if (!reason) {
            return NextResponse.json(
                { error: 'Refund reason is required' },
                { status: 400 }
            );
        }

        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
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

        if (!payment) {
            return NextResponse.json(
                { error: 'Payment not found' },
                { status: 404 }
            );
        }

        if (payment.status !== 'PAID') {
            return NextResponse.json(
                { error: 'Only paid payments can be refunded' },
                { status: 400 }
            );
        }

        const updatedPayment = await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'REFUNDED',
                refundReason: reason,
                refundedAt: new Date(),
            },
        });

        // Update service status if needed
        if (payment.service) {
            await prisma.service.update({
                where: { id: payment.service.id },
                data: {
                    paymentStatus: 'REFUNDED',
                },
            });
        }

        return NextResponse.json(updatedPayment);
    }
    catch (error) {
        logger.error('Error processing refund:', error);
        return NextResponse.json(
            { error: 'Failed to process refund' },
            { status: 500 }
        );
    }
}

// Map our reason codes to Stripe reason codes
function mapRefundReason(reason) {
    switch (reason) {
        case 'DUPLICATE':
            return 'duplicate';
        case 'FRAUD':
            return 'fraudulent';
        default:
            return 'requested_by_customer';
    }
}
