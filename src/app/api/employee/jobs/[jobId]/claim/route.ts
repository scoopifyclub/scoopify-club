import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    // Verify employee authorization
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get employee details
    const employee = await prisma.employee.findUnique({
      where: { userId: decoded.id },
      include: {
        serviceAreas: true,
        services: {
          where: {
            scheduledFor: {
              gte: new Date()
            }
          }
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Get the service
    const service = await prisma.service.findUnique({
      where: { id: params.jobId },
      include: {
        address: true
      }
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Verify service is still available
    if (service.employeeId) {
      return NextResponse.json(
        { error: 'Service has already been claimed' },
        { status: 400 }
      );
    }

    // Verify service is in employee's service area
    const isInServiceArea = employee.serviceAreas.some(
      area => area.zipCode === service.address.zipCode
    );

    if (!isInServiceArea) {
      return NextResponse.json(
        { error: 'Service is not in your service area' },
        { status: 400 }
      );
    }

    // Check for scheduling conflicts
    const serviceHour = new Date(service.scheduledFor).getHours();
    const hasConflict = employee.services.some(
      existingService =>
        new Date(existingService.scheduledFor).getHours() === serviceHour
    );

    if (hasConflict) {
      return NextResponse.json(
        { error: 'You already have a service scheduled at this time' },
        { status: 400 }
      );
    }

    // Claim the service
    const updatedService = await prisma.service.update({
      where: { id: params.jobId },
      data: {
        employeeId: employee.id,
        status: 'ASSIGNED'
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    // Create notification for customer
    await prisma.notification.create({
      data: {
        userId: updatedService.customer.user.id,
        type: 'SERVICE_ASSIGNED',
        title: 'Service Provider Assigned',
        message: `${employee.name} will be servicing your yard on ${new Date(service.scheduledFor).toLocaleDateString()} at ${new Date(service.scheduledFor).toLocaleTimeString()}`,
        data: { serviceId: service.id }
      }
    });

    return NextResponse.json({
      message: 'Service claimed successfully',
      service: updatedService
    });
  } catch (error) {
    console.error('Error claiming service:', error);
    return NextResponse.json(
      { error: 'Failed to claim service' },
      { status: 500 }
    );
  }
} 