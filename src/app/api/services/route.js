import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/api-auth';
import { cookies } from 'next/headers';
import { sendServiceNotificationEmail } from '@/lib/email';

export async function POST(request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'CUSTOMER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { scheduledFor, servicePlanId, specialInstructions } = await request.json();

        if (!servicePlanId) {
            return NextResponse.json({ error: 'Service plan ID is required' }, { status: 400 });
        }

        const customer = await prisma.customer.findUnique({
            where: { userId: decoded.id },
            include: {
                user: true,
                address: true,
            },
        });

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        // Verify service plan exists and is active
        const servicePlan = await prisma.servicePlan.findUnique({
            where: { id: servicePlanId },
        });

        if (!servicePlan || !servicePlan.isActive) {
            return NextResponse.json({ error: 'Invalid service plan' }, { status: 400 });
        }

        const service = await prisma.service.create({
            data: {
                customerId: customer.id,
                servicePlanId,
                scheduledDate: new Date(scheduledFor),
                status: 'SCHEDULED',
                specialInstructions,
                serviceArea: {
                    connect: {
                        zipCode: customer.address.zipCode
                    }
                }
            },
            include: {
                customer: {
                    include: {
                        user: true,
                        address: true,
                    },
                },
                servicePlan: true,
            },
        });

        // Send notification email
        await sendServiceNotificationEmail(service);

        return NextResponse.json({
            success: true,
            service
        });
    } catch (error) {
        console.error('Error in services POST route:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        if (!startDate || !endDate) {
            return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 });
        }

        // Build where clause based on user role
        let where = {
            scheduledDate: {
                gte: new Date(startDate),
                lte: new Date(endDate),
            }
        };

        // Add status filter if provided
        if (status) {
            where.status = status;
        }

        // Add role-specific filters
        if (decoded.role === 'CUSTOMER') {
            const customer = await prisma.customer.findUnique({
                where: { userId: decoded.id }
            });
            if (!customer) {
                return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
            }
            where.customerId = customer.id;
        } else if (decoded.role === 'EMPLOYEE') {
            const employee = await prisma.employee.findUnique({
                where: { userId: decoded.id }
            });
            if (!employee) {
                return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
            }
            where.employeeId = employee.id;
        }

        // Get total count for pagination
        const total = await prisma.service.count({ where });

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
                        address: true,
                    },
                },
                employee: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true
                            }
                        },
                    },
                },
                servicePlan: true,
                serviceArea: true,
                photos: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            },
            orderBy: {
                scheduledDate: 'asc',
            },
            skip: (page - 1) * limit,
            take: limit,
        });

        return NextResponse.json({
            success: true,
            services,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        console.error('Error in services GET route:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
