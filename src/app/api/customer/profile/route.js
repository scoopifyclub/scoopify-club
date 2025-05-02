import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/api-auth';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
// Helper function to get token and validate
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
export async function GET(request) {
    try {
        console.log('Customer profile GET request received');
        // Get and validate token - this will include customer data
        const { userId, customerId, customer } = await getTokenAndValidate(request, 'CUSTOMER');
        console.log('Token validated, userId:', userId, 'customerId:', customerId);
        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        // Return the customer data that was already fetched during validation
        console.log('Customer data retrieved successfully');
        return NextResponse.json(customer);
    }
    catch (error) {
        console.error('Profile error:', error);
        if (error instanceof Error) {
            if (error.message === 'Unauthorized') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            if (error.message === 'Customer record not found') {
                return NextResponse.json({ error: 'Customer record not found' }, { status: 404 });
            }
        }
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch profile' }, { status: 500 });
    }
}
export async function PUT(request) {
    try {
        console.log('Customer profile PUT request received');
        // Get and validate token
        const { userId, customerId, customer } = await getTokenAndValidate(request, 'CUSTOMER');
        console.log('Token validated, userId:', userId, 'customerId:', customerId);
        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        const body = await request.json();
        const { phone, gateCode, serviceDay, address, cashAppName } = body;
        console.log('Update data received:', { phone, gateCode, serviceDay, address, cashAppName });
        // Update customer and address in a transaction
        const updatedCustomer = await prisma.$transaction(async (tx) => {
            // Update customer
            const customer = await tx.customer.update({
                where: { id: customerId },
                data: Object.assign({ phone,
                    gateCode,
                    serviceDay,
                    cashAppName }, (address && {
                    address: {
                        upsert: {
                            where: {
                                customerId: customerId
                            },
                            create: Object.assign(Object.assign({}, address), { customerId: customerId }),
                            update: address
                        }
                    }
                })),
                include: {
                    address: true,
                    user: {
                        select: {
                            email: true,
                            name: true
                        }
                    }
                }
            });
            return customer;
        });
        console.log('Customer profile updated successfully');
        return NextResponse.json(updatedCustomer);
    }
    catch (error) {
        console.error('Profile update error:', error);
        if (error instanceof Error) {
            if (error.message === 'Unauthorized') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            if (error.message === 'Customer record not found') {
                return NextResponse.json({ error: 'Customer record not found' }, { status: 404 });
            }
            if (error.message.includes('Prisma')) {
                return NextResponse.json({ error: 'Database error' }, { status: 500 });
            }
        }
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update profile' }, { status: 500 });
    }
}
