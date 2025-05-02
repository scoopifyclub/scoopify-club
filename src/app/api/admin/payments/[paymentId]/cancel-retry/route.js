import { requireRole } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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

        const updatedPayment = await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'CANCELLED',
                retryCount: 0,
            },
        });

        return NextResponse.json(updatedPayment);
    }
    catch (error) {
        console.error('Error cancelling payment retry:', error);
        return NextResponse.json(
            { error: 'Failed to cancel payment retry' },
            { status: 500 }
        );
    }
}
