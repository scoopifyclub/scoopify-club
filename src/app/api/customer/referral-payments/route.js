import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
// Helper function to get token and validate
async function getTokenAndValidate(request, role = 'CUSTOMER') {
    var _a, _b, _c, _d;
    // Try header first
    let token = ((_a = request.headers.get('authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1]) ||
        ((_b = request.headers.get('Authorization')) === null || _b === void 0 ? void 0 : _b.split(' ')[1]);
    // If no token in header, try cookies
    if (!token) {
        const cookieStore = await cookies();
        token = ((_c = cookieStore.get('accessToken')) === null || _c === void 0 ? void 0 : _c.value) || ((_d = cookieStore.get('accessToken_client')) === null || _d === void 0 ? void 0 : _d.value);
    }
    // Still no token
    if (!token) {
        console.log('No token found in request headers or cookies');
        throw new Error('Unauthorized');
    }
    // Validate the token
    try {
        return await validateUser(token, role);
    }
    catch (error) {
        console.error('Token validation error:', error);
        throw error;
    }
}
export async function GET(request) {
    try {
        console.log('Customer referral payments GET request received');
        // Get and validate token - this will include customer data
        const { userId, customerId, customer } = await getTokenAndValidate(request, 'CUSTOMER');
        console.log('Token validated, userId:', userId, 'customerId:', customerId);
        if (!customer) {
            return NextResponse.json({ error: 'Customer record not found' }, { status: 404 });
        }
        // Get referral payments for this customer
        const payments = await prisma.payment.findMany({
            where: {
                customerId: customer.id,
                type: {
                    in: ['REFERRAL', 'MONTHLY_REFERRAL']
                },
                status: 'COMPLETED'
            },
            include: {
                referred: {
                    include: {
                        user: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        // Format the response
        const formattedPayments = payments.map(payment => {
            var _a, _b;
            return ({
                id: payment.id,
                amount: payment.amount,
                date: payment.createdAt,
                referredName: ((_b = (_a = payment.referred) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown',
                type: payment.type
            });
        });
        console.log(`Found ${formattedPayments.length} referral payments`);
        return NextResponse.json({ payments: formattedPayments });
    }
    catch (error) {
        console.error('Error getting referral payments:', error);
        if (error instanceof Error) {
            if (error.message === 'Unauthorized') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            if (error.message === 'Customer record not found') {
                return NextResponse.json({ error: 'Customer record not found' }, { status: 404 });
            }
            // Return detailed error message in development
            if (process.env.NODE_ENV !== 'production') {
                return NextResponse.json({
                    error: 'Failed to get referral payments',
                    message: error.message,
                    stack: error.stack
                }, { status: 500 });
            }
        }
        return NextResponse.json({ error: 'Failed to get referral payments' }, { status: 500 });
    }
}
