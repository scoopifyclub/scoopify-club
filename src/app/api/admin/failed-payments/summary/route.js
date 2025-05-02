import { requireRole } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    try {
        const user = await requireRole('ADMIN');
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const failedPayments = await prisma.payment.findMany({
            where: {
                status: 'FAILED',
            },
            include: {
                service: {
                    include: {
                        customer: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const summary = {
            totalFailedPayments: failedPayments.length,
            totalAmount: failedPayments.reduce((sum, payment) => sum + payment.amount, 0),
            recentFailures: failedPayments.slice(0, 5).map(payment => ({
                id: payment.id,
                amount: payment.amount,
                customerName: payment.service.customer.user.name,
                customerEmail: payment.service.customer.user.email,
                failedAt: payment.createdAt,
            })),
        };

        return NextResponse.json(summary);
    }
    catch (error) {
        console.error('Error fetching failed payments summary:', error);
        return NextResponse.json(
            { error: 'Failed to fetch payments summary' },
            { status: 500 }
        );
    }
}
