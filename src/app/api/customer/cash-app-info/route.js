import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/api-auth';
import { cookies } from 'next/headers';
import prisma from "@/lib/prisma";

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
    var _a;
    try {
        // Check authentication
        // Get access token from cookies
        const cookieStore = await cookies();
        const accessToken = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Validate the token and check role
        const { userId, role } = await validateUser(accessToken);
        if (!session || role !== 'CUSTOMER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Find customer
        const customer = await prisma.customer.findFirst({
            where: {
                user: {
                    email: session.user.email
                }
            },
            select: {
                cashAppName: true
            }
        });
        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        return NextResponse.json({ cashAppName: customer.cashAppName });
    }
    catch (error) {
        console.error('Error fetching Cash App info:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function PUT(request) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session || role !== 'CUSTOMER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Get data from request
        const data = await request.json();
        const { cashAppName } = data;
        // Validate
        if (!cashAppName) {
            return NextResponse.json({ error: 'Cash App name is required' }, { status: 400 });
        }
        if (!cashAppName.startsWith('$')) {
            return NextResponse.json({ error: 'Cash App name must start with $' }, { status: 400 });
        }
        // Update customer
        const customer = await prisma.customer.updateMany({
            where: {
                user: {
                    email: session.user.email
                }
            },
            data: {
                cashAppName
            }
        });
        return NextResponse.json({
            success: true,
            message: 'Cash App information updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating Cash App info:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
