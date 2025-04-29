import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
export async function GET(request) {
    try {
        // First, get all failed payments with their related data
        const failedPayments = await prisma.payment.findMany({
            where: {
                status: 'FAILED'
            },
            include: {
                customer: {
                    include: {
                        user: true
                    }
                },
                subscription: true,
                retries: {
                    orderBy: {
                        scheduledDate: 'asc'
                    },
                    take: 1
                }
            }
        });
        // Then, get retry counts for all payments in a single query
        const retryCounts = await prisma.paymentRetry.groupBy({
            by: ['paymentId'],
            where: {
                paymentId: {
                    in: failedPayments.map(p => p.id)
                },
                status: {
                    in: ['COMPLETED', 'FAILED']
                }
            },
            _count: {
                paymentId: true
            }
        });
        // Create a map of payment ID to retry count for easy lookup
        const retryCountMap = new Map(retryCounts.map(rc => [rc.paymentId, rc._count.paymentId]));
        // Format the response
        const formattedPayments = failedPayments.map(payment => {
            var _a, _b, _c;
            return ({
                id: payment.id,
                amount: payment.amount,
                date: payment.createdAt,
                status: payment.status,
                customer: payment.customer ? {
                    id: payment.customer.id,
                    name: (_a = payment.customer.user) === null || _a === void 0 ? void 0 : _a.name,
                    email: (_b = payment.customer.user) === null || _b === void 0 ? void 0 : _b.email
                } : null,
                subscription: payment.subscription ? {
                    id: payment.subscription.id,
                    status: payment.subscription.status,
                    startDate: payment.subscription.startDate,
                    endDate: payment.subscription.endDate
                } : null,
                retryAttempts: retryCountMap.get(payment.id) || 0,
                nextRetryDate: ((_c = payment.retries[0]) === null || _c === void 0 ? void 0 : _c.scheduledDate) || null
            });
        });
        return NextResponse.json(formattedPayments);
    }
    catch (error) {
        console.error('Error fetching failed payments:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
