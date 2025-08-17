import { NextResponse } from 'next/server';
import { validateUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value || 
                     cookieStore.get('token')?.value || 
                     cookieStore.get('refreshToken')?.value;
        
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
        }
        
        const decoded = await validateUserToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const page = parseInt(searchParams.get('page') || '1');
        const status = searchParams.get('status');

        // Build where clause based on user role
        let where = {};
        
        if (decoded.role === 'CUSTOMER') {
            const customer = await prisma.customer.findFirst({
                where: { userId: decoded.userId }
            });
            if (!customer) {
                return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
            }
            where.customerId = customer.id;
        } else if (decoded.role === 'EMPLOYEE') {
            const employee = await prisma.employee.findFirst({
                where: { userId: decoded.userId }
            });
            if (!employee) {
                return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });
            }
            where.employeeId = employee.id;
        }

        // Add status filter if provided
        if (status) {
            where.status = status;
        }

        // Get payments with pagination
        const payments = await prisma.payment.findMany({
            where,
            include: {
                service: {
                    include: {
                        servicePlan: {
                            select: {
                                name: true,
                                price: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit,
            skip: (page - 1) * limit
        });

        // Get total count for pagination
        const totalCount = await prisma.payment.count({ where });

        // Format payment data
        const formattedPayments = payments.map(payment => ({
            id: payment.id,
            amount: payment.amount,
            status: payment.status,
            type: payment.type,
            paymentMethod: payment.paymentMethod,
            date: payment.createdAt,
            service: payment.service ? {
                name: payment.service.servicePlan?.name || 'Unknown Service',
                price: payment.service.servicePlan?.price || 0
            } : null
        }));

        return NextResponse.json({
            success: true,
            data: formattedPayments,
            pagination: {
                page,
                limit,
                total: totalCount,
                pages: Math.ceil(totalCount / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching payment history:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch payment history',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request) {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}
