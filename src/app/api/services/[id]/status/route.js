import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { emitServiceStatusChange } from '@/lib/socket';
import { sendServiceNotificationEmail } from '@/lib/email';

export async function PATCH(request, { params }) {
    try {
        const token = cookies().get('token')?.value;
        const user = await verifyToken(token);

        if (!user || !['ADMIN', 'EMPLOYEE'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Unauthorized access' },
                { status: 401 }
            );
        }

        const { id } = params;
        const { status, notes } = await request.json();

        // Validate status
        const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status' },
                { status: 400 }
            );
        }

        // Get the current service
        const service = await prisma.service.findUnique({
            where: { id },
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
                servicePlan: true
            }
        });

        if (!service) {
            return NextResponse.json(
                { error: 'Service not found' },
                { status: 404 }
            );
        }

        // Update service status
        const updatedService = await prisma.service.update({
            where: { id },
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
                notes: {
                    include: {
                        user: true
                    }
                }
            }
        });

        // Emit real-time update
        emitServiceStatusChange(id, status, {
            message: `Service status updated to ${status}`,
            notes,
            updatedBy: user.name
        });

        // Send email notification
        if (service.customer?.user?.email) {
            await sendServiceNotificationEmail(
                service.customer.user.email,
                service.id,
                status.toLowerCase(),
                {
                    date: service.scheduledAt.toLocaleString(),
                    address: service.customer.address,
                    employeeName: service.employee?.user?.name,
                    notes
                }
            );
        }

        return NextResponse.json({
            message: 'Service status updated successfully',
            service: updatedService
        });

    } catch (error) {
        console.error('Error updating service status:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 