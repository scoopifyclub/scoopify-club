import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/api-auth';
import { addMinutes, setHours, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';
import { sendServiceNotificationEmail } from '@/lib/email-service';

// API endpoint for employee to claim a service
export async function POST(request, { params }) {
    try {
        // Verify employee authorization
        const token = request.headers.get('Authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const payload = await verifyToken(token);
        if (!payload || payload.role !== 'EMPLOYEE') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if current time is between 8am and 7pm
        const now = new Date();
        const today = new Date();
        const eightAM = setHours(startOfDay(today), 8);
        const sevenPM = setHours(startOfDay(today), 19);
        
        if (isBefore(now, eightAM) || isAfter(now, sevenPM)) {
            return NextResponse.json({ 
                error: 'Services can only be claimed between 8:00 AM and 7:00 PM' 
            }, { status: 400 });
        }

        // Get the employee record with current active services and rating
        const employee = await prisma.employee.findUnique({
            where: { userId: payload.userId },
            include: {
                services: {
                    where: {
                        scheduledDate: {
                            gte: startOfDay(today),
                            lt: endOfDay(today)
                        },
                        status: {
                            in: ['ASSIGNED', 'IN_PROGRESS']
                        }
                    }
                },
                serviceAreas: true
            }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee record not found' }, { status: 404 });
        }

        // Check employee's rating for queuing eligibility
        const employeeRating = employee.averageRating || 0;
        const canQueueJobs = employeeRating >= 4.5;
        const hasActiveService = employee.services.length > 0;

        // If employee has an active service and can't queue, prevent claiming
        if (hasActiveService && !canQueueJobs) {
            return NextResponse.json({ 
                error: 'You have an active service. Complete it before claiming another. (Rating-based queuing requires 4.5+ stars)' 
            }, { status: 400 });
        }

        const { id } = params;

        // Check if the service exists and is available to claim
        const service = await prisma.service.findUnique({
            where: { id: id },
            include: {
                customer: {
                    include: {
                        user: true,
                        address: true
                    }
                },
                servicePlan: true,
            },
        });

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        // Check if service is locked
        if (service.isLocked) {
            return NextResponse.json({ 
                error: 'This job is not yet available. Jobs unlock at 8:00 AM.' 
            }, { status: 400 });
        }

        if (service.employeeId) {
            return NextResponse.json({ 
                error: 'Service already claimed by another employee' 
            }, { status: 409 });
        }

        if (service.status !== 'SCHEDULED') {
            return NextResponse.json({ 
                error: 'Service is not available for claiming' 
            }, { status: 400 });
        }

        // Verify service is in employee's service area
        const customerZipCode = service.customer.address?.zipCode;
        if (!customerZipCode) {
            return NextResponse.json({ 
                error: 'Customer address information is incomplete' 
            }, { status: 400 });
        }

        const isInServiceArea = employee.serviceAreas.some(area => area.zipCode === customerZipCode);
        if (!isInServiceArea) {
            return NextResponse.json({ 
                error: 'This service is outside your service area' 
            }, { status: 400 });
        }

        // Set arrival deadline (2 hours from claiming)
        const arrivalDeadline = addMinutes(new Date(), 120);

        // Claim the service
        const updatedService = await prisma.service.update({
            where: { id: id },
            data: {
                employeeId: employee.id,
                status: 'IN_PROGRESS', // Use correct enum value
                claimedAt: new Date(),
                arrivalDeadline
            },
            include: {
                customer: {
                    include: {
                        user: true,
                        address: true
                    }
                },
                servicePlan: true
            }
        });

        // Log the job claim
        await prisma.systemLog.create({
            data: {
                level: 'INFO',
                category: 'JOB_CLAIM',
                message: `Employee ${employee.name} claimed service ${service.id}`,
                data: {
                    employeeId: employee.id,
                    serviceId: service.id,
                    customerId: service.customerId,
                    claimedAt: new Date().toISOString(),
                    employeeRating: employeeRating,
                    canQueueJobs: canQueueJobs,
                    hasActiveService: hasActiveService
                }
            }
        });

        // Send notification to customer
        try {
            await sendServiceNotificationEmail(
                updatedService.customer.user.email, 
                updatedService.id, 
                'claimed', 
                {
                    date: updatedService.scheduledDate.toLocaleDateString(),
                    address: `${updatedService.customer.address?.street || ''}, ${updatedService.customer.address?.city || ''}`,
                    employeeName: employee.name || 'Your service provider'
                }
            );
        } catch (emailError) {
            console.error('Failed to send email notification:', emailError);
            // Continue with the response even if email fails
        }

        return NextResponse.json({
            message: 'Service claimed successfully',
            service: updatedService,
            employeeStatus: {
                hasActiveService: hasActiveService,
                canQueueJobs: canQueueJobs,
                averageRating: employeeRating,
                activeServiceCount: employee.services.length + 1
            }
        });

    } catch (error) {
        console.error('Error claiming service:', error);
        
        // Log the error
        await prisma.systemLog.create({
            data: {
                level: 'ERROR',
                category: 'JOB_CLAIM',
                message: 'Failed to claim service',
                data: {
                    error: error.message,
                    stack: error.stack
                }
            }
        });

        return NextResponse.json({ error: 'Failed to claim service' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const token = request.headers.get('Authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const { userId, role } = await verifyToken(token);
        if (role !== 'EMPLOYEE') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const employee = await prisma.employee.findUnique({
            where: { userId }
        });
        
        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        // Extend the expiration time by 15 minutes
        const service = await prisma.service.update({
            where: {
                id: (await params).serviceId,
                employeeId: employee.id,
                status: 'CLAIMED'
            },
            data: {
                expiresAt: addMinutes(new Date(), 15)
            }
        });

        if (!service) {
            return NextResponse.json({ 
                error: 'Service not found or not claimed by you' 
            }, { status: 404 });
        }

        return NextResponse.json(service);
    } catch (error) {
        console.error('Extend service error:', error);
        return NextResponse.json({ error: 'Failed to extend service time' }, { status: 500 });
    }
}
