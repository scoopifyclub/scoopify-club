import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/api-auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
export async function GET(request, { params }) {
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
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }
        const { customerId } = await params;
        // Check if user is authorized to view this customer's data
        const isAdmin = role === 'ADMIN';
        const isCustomerOwner = userId === customerId;
        if (!isAdmin && !isCustomerOwner) {
            return new NextResponse('Forbidden', { status: 403 });
        }
        // Fetch customer and subscription data
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
            select: {
                id: true,
                status: true,
                lastBillingDate: true,
                nextBillingDate: true,
                initialCleanupCompleted: true,
                initialCleanupFeePaid: true,
            },
        });
        if (!customer) {
            return new NextResponse('Customer not found', { status: 404 });
        }
        const subscription = await prisma.subscription.findFirst({
            where: { customerId },
            include: {
                paymentHistory: {
                    orderBy: { date: 'desc' },
                },
            },
        });
        return NextResponse.json({
            customer,
            subscription,
        });
    }
    catch (error) {
        console.error('Error fetching subscription data:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }
        const { customerId } = await params;
        const body = await request.json();
        const { action } = body;
        if (!['PAUSE', 'CANCEL'].includes(action)) {
            return new NextResponse('Invalid action', { status: 400 });
        }
        // Update subscription status
        const subscription = await prisma.subscription.update({
            where: { customerId },
            data: {
                status: action === 'PAUSE' ? 'PAUSED' : 'CANCELLED',
                endDate: action === 'CANCEL' ? new Date() : null,
            },
        });
        // Update customer status
        const customer = await prisma.customer.update({
            where: { id: customerId },
            data: {
                status: action === 'PAUSE' ? 'INACTIVE' : 'DO_NOT_SERVICE',
            },
        });
        return NextResponse.json({
            customer,
            subscription,
        });
    }
    catch (error) {
        console.error('Error updating subscription:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
