import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
// Helper function to get token from request
async function getTokenAndValidate(request, role = 'CUSTOMER') {
    var _a, _b, _c;
    // Try header first
    let token = (_a = request.headers.get('authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    // If no token in header, try cookies
    if (!token) {
        const cookieStore = await cookies();
        token = ((_b = cookieStore.get('accessToken')) === null || _b === void 0 ? void 0 : _b.value) || ((_c = cookieStore.get('accessToken_client')) === null || _c === void 0 ? void 0 : _c.value);
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
export async function PUT(request) {
    try {
        console.log('Customer cashapp PUT request received');
        // Get and validate token
        const { userId } = await getTokenAndValidate(request, 'CUSTOMER');
        console.log('Token validated, userId:', userId);
        const body = await request.json();
        const { cashAppName } = body;
        console.log('Update data received:', { cashAppName });
        if (cashAppName === undefined) {
            return NextResponse.json({ error: 'cashAppName is required' }, { status: 400 });
        }
        // Find the customer to update
        const existingCustomer = await prisma.customer.findFirst({
            where: { userId },
        });
        if (!existingCustomer) {
            console.log('Customer not found for userId:', userId);
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        // Update the customer with the cash app name
        console.log('About to update customer with cashAppName:', cashAppName);
        const customer = await prisma.customer.update({
            where: { userId },
            data: {
                cashAppName,
                updatedAt: new Date()
            },
        });
        console.log('Customer cashAppName updated successfully');
        return NextResponse.json(customer);
    }
    catch (error) {
        console.error('CashApp update error:', error);
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update Cash App name' }, { status: 500 });
    }
}
