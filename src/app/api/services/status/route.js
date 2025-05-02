import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/api-auth';
import { cookies } from 'next/headers';

const VALID_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED'];

export async function POST(request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || !['EMPLOYEE', 'ADMIN'].includes(decoded.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { serviceId, status, notes, photos, location } = await request.json();

        if (!serviceId || !status) {
            return NextResponse.json({ error: 'Service ID and status are required' }, { status: 400 });
        }

        if (!VALID_STATUSES.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Get employee details if role is EMPLOYEE
        let employee;
        if (decoded.role === 'EMPLOYEE') {
            employee = await prisma.employee.findUnique({
                where: { userId: decoded.id }
            });

            if (!employee) {
                return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
            }
        }

        // Get the service
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            include: {
                customer: {
                    include: {
                        user: {
                            select: {
                                email: true
                            }
                        }
                    }
                },
                employee: true
            }
        });

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        // If employee role, verify assignment
        if (decoded.role === 'EMPLOYEE' && service.employeeId !== employee.id) {
            return NextResponse.json({ error: 'You are not assigned to this service' }, { status: 403 });
        }

        // Start a transaction to update service and create related records
        const result = await prisma.$transaction(async (prisma) => {
            // Update service status
            const updatedService = await prisma.service.update({
                where: { id: serviceId },
                data: {
                    status,
                    notes,
                    completedAt: status === 'COMPLETED' ? new Date() : null,
                    location: location ? {
                        create: {
                            latitude: location.latitude,
                            longitude: location.longitude,
                            accuracy: location.accuracy
                        }
                    } : undefined
                }
            });

            // If photos provided, create them
            if (photos && Array.isArray(photos)) {
                await prisma.servicePhoto.createMany({
                    data: photos.map(photo => ({
                        serviceId,
                        url: photo.url,
                        type: photo.type
                    }))
                });
            }

            return updatedService;
        });

        // Fetch the updated service with all related data
        const updatedServiceWithDetails = await prisma.service.findUnique({
            where: { id: serviceId },
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
                photos: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                location: true,
                servicePlan: true
            }
        });

        return NextResponse.json({
            success: true,
            service: updatedServiceWithDetails
        });
    } catch (error) {
        console.error('Error updating service status:', error);
        return NextResponse.json({ error: 'Failed to update service status' }, { status: 500 });
    }
}
