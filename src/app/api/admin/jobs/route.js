import { NextResponse } from 'next/server';
import { withAdminDatabase } from '@/lib/prisma';
import { validateUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;
        
        if (!token) {
            console.log('No access token found in cookies');
            return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
        }
        
        const decoded = await validateUserToken(token);
        console.log('Token verification result:', decoded ? 'success' : 'failed');
        
        if (!decoded || decoded.role !== 'ADMIN') {
            console.log('Invalid token or not admin:', decoded?.role);
            return NextResponse.json({ error: 'Unauthorized - Not admin' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const employeeId = searchParams.get('employeeId');
        const customerId = searchParams.get('customerId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        // Build where clause
        const where = {};
        if (status) where.status = status;
        if (employeeId) where.employeeId = employeeId;
        if (customerId) where.customerId = customerId;

        const jobs = await withAdminDatabase(async (prisma) => {
            const [services, total] = await Promise.all([
                prisma.service.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: {
                        scheduledDate: 'desc'
                    },
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
                        employee: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        email: true
                                    }
                                }
                            }
                        },
                        servicePlan: true,
                        location: true,
                        photos: true
                    }
                }),
                prisma.service.count({ where })
            ]);

            return {
                services,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        });

        return NextResponse.json({
            success: true,
            data: jobs
        });
        
    } catch (error) {
        console.error('❌ Admin jobs API error:', error);
        
        if (error.code === 'P2024') {
            return NextResponse.json({ 
                error: 'Database connection timeout. Please try again.',
                code: 'CONNECTION_TIMEOUT' 
            }, { status: 503 });
        }
        
        return NextResponse.json({ 
            error: 'Failed to fetch jobs',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;
        
        if (!token) {
            console.log('No access token found in cookies');
            return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
        }
        
        const decoded = await validateUserToken(token);
        console.log('Token verification result:', decoded ? 'success' : 'failed');
        
        if (!decoded || decoded.role !== 'ADMIN') {
            console.log('Invalid token or not admin:', decoded?.role);
            return NextResponse.json({ error: 'Unauthorized - Not admin' }, { status: 401 });
        }

        const body = await request.json();
        const { customerId, employeeId, servicePlanId, scheduledDate, notes } = body;

        const newJob = await withAdminDatabase(async (prisma) => {
            return await prisma.service.create({
                data: {
                    customerId,
                    employeeId,
                    servicePlanId,
                    scheduledDate: new Date(scheduledDate),
                    notes,
                    status: 'SCHEDULED',
                    workflowStatus: 'PENDING'
                },
                include: {
                    customer: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    },
                    employee: {
                        include: {
                            user: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    },
                    servicePlan: true
                }
            });
        });

        return NextResponse.json({
            success: true,
            data: newJob
        });
        
    } catch (error) {
        console.error('❌ Admin jobs API error:', error);
        
        return NextResponse.json({ 
            error: 'Failed to create job',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request) {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}
