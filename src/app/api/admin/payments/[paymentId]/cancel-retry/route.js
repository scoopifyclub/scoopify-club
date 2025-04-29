import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
export async function POST(request, { params }) {
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
        const { paymentId } = await params;
        // Cancel all scheduled retries for this payment
        await prisma.paymentRetry.updateMany({
            where: {
                paymentId,
                status: 'SCHEDULED'
            },
            data: {
                status: 'CANCELLED'
            }
        });
        // Update customer status to DO_NOT_SERVICE
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                subscription: true
            }
        });
        if (payment && payment.subscriptionId) {
            await prisma.subscription.update({
                where: { id: payment.subscriptionId },
                data: {
                    status: 'CANCELLED',
                    endDate: new Date()
                }
            });
        }
        return NextResponse.json({ success: true });
    }
    catch (error) {
        console.error('Error cancelling payment retry:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
