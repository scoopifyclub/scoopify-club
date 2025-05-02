import { requireRole } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
const VALID_PAYMENT_METHODS = ['CASH', 'CASH_APP', 'CHECK'];
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
        const body = await request.json();
        const { paymentMethod, paidAt } = body;
        // Validate payment method
        if (!paymentMethod || !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
            return NextResponse.json({ error: 'Invalid payment method. Must be one of: CASH, CASH_APP, CHECK' }, { status: 400 });
        }
        // Validate payment date
        if (!paidAt || isNaN(new Date(paidAt).getTime())) {
            return NextResponse.json({ error: 'Invalid payment date' }, { status: 400 });
        }
        // Verify payment exists and is pending
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                service: {
                    include: {
                        customer: true,
                    },
                },
            },
        });
        if (!payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }
        if (payment.status !== 'PENDING') {
            return NextResponse.json({ error: `Payment is already ${payment.status.toLowerCase()}` }, { status: 400 });
        }
        // Start a transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // Update payment status and details
            const updatedPayment = await tx.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'PAID',
                    paymentMethod,
                    paidAt: new Date(paidAt),
                },
            });
            // Update related service status if needed
            if (payment.service) {
                await tx.service.update({
                    where: { id: payment.service.id },
                    data: {
                        paymentStatus: 'PAID',
                    },
                });
            }
            return updatedPayment;
        });
        return NextResponse.json(result);
    }
    catch (error) {
        console.error('Error marking payment as paid:', error);
        // Handle specific database errors
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
