import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { serviceId: string } }
) {
  try {
    // Verify customer authorization
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the service and verify ownership
    const service = await prisma.service.findUnique({
      where: { id: params.serviceId },
      include: {
        customer: true,
        employee: true
      }
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (service.customer.userId !== decoded.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if service can be cancelled (only scheduled services)
    if (service.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Only scheduled services can be cancelled' },
        { status: 400 }
      );
    }

    // Check cancellation time limit (e.g., 24 hours before service)
    const serviceDatetime = new Date(service.scheduledFor);
    const now = new Date();
    const hoursUntilService = (serviceDatetime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilService < 24) {
      return NextResponse.json(
        { error: 'Services must be cancelled at least 24 hours in advance' },
        { status: 400 }
      );
    }

    // Cancel the service
    const updatedService = await prisma.service.update({
      where: { id: params.serviceId },
      data: { status: 'CANCELLED' }
    });

    // Create notification for employee
    if (service.employee) {
      await prisma.notification.create({
        data: {
          userId: service.employee.userId,
          type: 'SERVICE_CANCELLED',
          title: 'Service Cancelled',
          message: `Service scheduled for ${serviceDatetime.toLocaleDateString()} has been cancelled by the customer.`,
          data: { serviceId: service.id }
        }
      });
    }

    return NextResponse.json({
      service: updatedService,
      message: 'Service cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling service:', error);
    return NextResponse.json(
      { error: 'Failed to cancel service' },
      { status: 500 }
    );
  }
} 