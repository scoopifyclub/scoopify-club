import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import prisma from "@/lib/prisma";
export async function GET(request) {
    var _a;
    try {
        // Get access token from cookies
        const cookieStore = await cookies();
        const accessToken = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Validate the token and check role
        const { userId, role } = await validateUser(accessToken);
        if (role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }
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
                subscription: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        });
        const totalAmount = failedPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const summary = {
            count: failedPayments.length,
            totalAmount,
            recentPayments: failedPayments.map(payment => {
                var _a, _b;
                return ({
                    id: payment.id,
                    customerName: ((_b = (_a = payment.customer) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown',
                    amount: payment.amount,
                    date: payment.createdAt
                });
            })
        };
        return NextResponse.json(summary);
    }
    catch (error) {
        console.error('Error fetching failed payments summary:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
