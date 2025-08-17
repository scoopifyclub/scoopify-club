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
        if (!decoded || decoded.role !== 'EMPLOYEE') {
            return NextResponse.json({ error: 'Unauthorized - Not employee' }, { status: 401 });
        }

        // Get employee record
        const employee = await prisma.employee.findUnique({
            where: { userId: decoded.userId }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');
        const page = parseInt(searchParams.get('page') || '1');

        // Build where clause
        let where = {
            employeeId: employee.id
        };

        // Add status filter if provided
        if (status) {
            where.status = status;
        }

        // Get completed services with pagination
        const services = await prisma.service.findMany({
            where,
            include: {
                customer: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true
                            }
                        },
                        address: true
                    }
                },
                servicePlan: {
                    select: {
                        name: true,
                        price: true,
                        duration: true
                    }
                },
                photos: true,
                location: true
            },
            orderBy: {
                completedDate: 'desc'
            },
            take: limit,
            skip: (page - 1) * limit
        });

        // Get total count for pagination
        const totalCount = await prisma.service.count({ where });

        return NextResponse.json({
            success: true,
            data: services,
            pagination: {
                page,
                limit,
                total: totalCount,
                pages: Math.ceil(totalCount / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching employee service history:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch service history',
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
