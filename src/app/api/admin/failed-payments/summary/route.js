import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

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
