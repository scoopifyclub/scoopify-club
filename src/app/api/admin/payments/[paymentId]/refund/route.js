import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { logPaymentEvent } from '@/lib/payment-audit';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/admin-auth';
import { mapRefundStatus } from '@/lib/stripe-billing';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


export async function POST(request, { params }) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;
        const user = auth.user;

        const { paymentId } = await params;
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

        if (payment.refundStatus === 'COMPLETED' || payment.refundStatus === 'PENDING') {
            return NextResponse.json(
                { error: 'This payment already has a refund' },
                { status: 409 }
            );
        }

        if (!payment.stripePaymentIntentId) {
            return NextResponse.json(
                { error: 'Only Stripe payments can be refunded here' },
                { status: 400 }
            );
        }

        if (!stripe) {
            return NextResponse.json(
                { error: 'Stripe is not configured' },
                { status: 500 }
            );
        }

        // Full refund. The key makes a retried or double-clicked request
        // return the same Stripe refund instead of refunding twice.
        let refund;
        try {
            refund = await stripe.refunds.create({
                payment_intent: payment.stripePaymentIntentId,
                reason: mapRefundReason(reason),
                metadata: { paymentId, refundedBy: user.id, reason },
            }, { idempotencyKey: `admin-refund-${paymentId}` });
        }
        catch (stripeError) {
            logger.error('Stripe refund failed:', stripeError);
            await prisma.payment.update({
                where: { id: paymentId },
                data: { refundStatus: 'FAILED', refundReason: reason, updatedAt: new Date() },
            });
            return NextResponse.json(
                { error: stripeError.message || 'Stripe refund failed' },
                { status: 502 }
            );
        }

        const refundStatus = mapRefundStatus(refund.status);
        const updatedPayment = await prisma.payment.update({
            where: { id: paymentId },
            data: {
                refundStatus,
                refundedAmount: refund.amount / 100,
                refundedAt: new Date(),
                refundedBy: user.id,
                refundReason: reason,
                refundTransactionId: refund.id,
                updatedAt: new Date(),
            },
        });

        if (payment.service && refundStatus !== 'FAILED') {
            await prisma.service.update({
                where: { id: payment.service.id },
                data: {
                    paymentStatus: 'REFUNDED',
                    updatedAt: new Date(),
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
