import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/auth'
import { isWithinInterval, addDays, setHours, setMinutes } from 'date-fns'

export async function POST(req: Request) {
  try {
    // Verify scooper authorization
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'EMPLOYEE') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { serviceId } = await req.json();

    if (!serviceId) {
      return new NextResponse('Service ID is required', { status: 400 });
    }

    // Get employee details
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id },
      include: {
        serviceAreas: true
      }
    });

    if (!employee) {
      return new NextResponse('Employee profile not found', { status: 404 });
    }

    // Get the service and verify it can be claimed
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        serviceArea: true,
        customer: true
      }
    });

    if (!service) {
      return new NextResponse('Service not found', { status: 404 });
    }

    // Verify service is available
    if (service.status !== 'SCHEDULED' || service.employeeId) {
      return new NextResponse('Service is not available for claiming', { status: 400 });
    }

    // Verify service is in scooper's service area
    const canService = employee.serviceAreas.some(
      area => area.zipCode === service.serviceArea?.zipCode
    );

    if (!canService) {
      return new NextResponse('Service is not in your service area', { status: 400 });
    }

    // Check if scooper already has a service scheduled for this time
    const conflictingService = await prisma.service.findFirst({
      where: {
        employeeId: employee.id,
        scheduledDate: service.scheduledDate,
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS']
        }
      }
    });

    if (conflictingService) {
      return new NextResponse('You already have a service scheduled for this time', { status: 400 });
    }

    // Claim the service with a transaction to ensure atomicity
    const claimedService = await prisma.$transaction(async (tx) => {
      // Double-check the service hasn't been claimed while we were checking
      const freshService = await tx.service.findUnique({
        where: { id: serviceId }
      });

      if (freshService?.employeeId) {
        throw new Error('Service was just claimed by another scooper');
      }

      // Claim the service
      return tx.service.update({
        where: { id: serviceId },
        data: {
          employeeId: employee.id
        },
        include: {
          customer: {
            include: {
              address: true,
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

    // Format the response
    const formattedService = {
      id: claimedService.id,
      scheduledDate: claimedService.scheduledDate,
      potentialEarnings: claimedService.potentialEarnings,
      customerName: claimedService.customer.user.name,
      address: {
        street: claimedService.customer.address?.street,
        city: claimedService.customer.address?.city,
        state: claimedService.customer.address?.state,
        zipCode: claimedService.customer.address?.zipCode
      },
      servicePlan: {
        name: claimedService.servicePlan.name,
        duration: claimedService.servicePlan.duration
      },
      gateCode: claimedService.customer.gateCode
    };

    return NextResponse.json({
      message: 'Service claimed successfully',
      service: formattedService
    });
  } catch (error) {
    console.error('Error claiming service:', error);
    if (error.message === 'Service was just claimed by another scooper') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to claim service' },
      { status: 500 }
    );
  }
} 