import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/api-auth';
import { cookies } from 'next/headers';
import { emitServiceStatusChange } from '@/lib/socket';
import { sendServiceNotificationEmail } from '@/lib/email-service';

export async function PUT(request, { params }) {
    try {
        const token = cookies().get('token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await verifyToken(token);
        if (!user || !['ADMIN', 'EMPLOYEE'].includes(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const { status, notes } = await request.json();

        // Validate status
        const validStatuses = ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Get the current service
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            include: {
                customer: {
                    include: {
                        user: true
                    }
                },
                employee: {
                    include: {
                        user: true
                    }
                },
                servicePlan: true,
                checklist: true,
                photos: true
            }
        });

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        // If employee is updating, verify they are assigned to this service
        if (user.role === 'EMPLOYEE' && service.employeeId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Update service status
        const updatedService = await prisma.service.update({
            where: { id: serviceId },
            data: {
                status,
                notes: notes ? {
                    create: {
                        content: notes,
                        userId: user.id
                    }
                } : undefined,
                ...(status === 'COMPLETED' ? { completedAt: new Date() } : {})
            },
            include: {
                customer: {
                    include: {
                        user: true
                    }
                },
                employee: {
                    include: {
                        user: true
                    }
                },
                servicePlan: true,
                checklist: true,
                photos: true,
                notes: {
                    include: {
                        user: true
                    }
                }
            }
        });

        // Emit real-time update
        emitServiceStatusChange(serviceId, status, {
            message: `Service status updated to ${status}`,
            notes,
            updatedBy: user.name
        });

        // Send email notification
        if (service.customer?.user?.email) {
            await sendServiceNotificationEmail(
                service.customer.user.email,
                serviceId,
                status.toLowerCase(),
                {
                    date: service.scheduledAt.toLocaleString(),
                    address: service.customer.address,
                    employeeName: service.employee?.user?.name,
                    notes
                }
            );
        }

        return NextResponse.json(updatedService);
    } catch (error) {
        console.error('Error updating service status:', error);
        return NextResponse.json({ error: 'Failed to update service status' }, { status: 500 });
    }
}

export async function GET(request, { params }) {
    try {
        const token = cookies().get('token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await verifyToken(token);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            include: {
                customer: true,
                employee: true,
                checklist: true,
                photos: true
            }
        });

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        // Only allow access if user is the customer or employee
        if (user.role === 'CUSTOMER' && service.customerId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (user.role === 'EMPLOYEE' && service.employeeId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json(service);
    } catch (error) {
        console.error('Error fetching service:', error);
        return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 });
    }
}
