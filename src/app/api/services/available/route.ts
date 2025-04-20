import { NextRequest, NextResponse } from 'next/server'
import prisma from "@/lib/prisma";
import { requireRole } from '@/lib/auth'
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const GET = requireRole(['EMPLOYEE'])(async (request: NextRequest, user) => {
  try {
    // Verify scooper authorization
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'EMPLOYEE') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get employee details to check service areas
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id },
      include: {
        serviceAreas: true
      }
    });

    if (!employee) {
      return new NextResponse('Employee profile not found', { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const date = searchParams.get('date') ? new Date(searchParams.get('date')!) : new Date();

    // Get available services in scooper's service areas
    const availableServices = await prisma.service.findMany({
      where: {
        status: 'SCHEDULED',
        employeeId: null, // Not claimed by any scooper
        scheduledDate: {
          gte: date, // Only future services
        },
        serviceArea: {
          zipCode: {
            in: employee.serviceAreas.map(area => area.zipCode)
          }
        }
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
      },
      orderBy: [
        { scheduledDate: 'asc' },
        { createdAt: 'asc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.service.count({
      where: {
        status: 'SCHEDULED',
        employeeId: null,
        scheduledDate: {
          gte: date,
        },
        serviceArea: {
          zipCode: {
            in: employee.serviceAreas.map(area => area.zipCode)
          }
        }
      }
    });

    // Format the response
    const formattedServices = availableServices.map(service => ({
      id: service.id,
      scheduledDate: service.scheduledDate,
      potentialEarnings: service.potentialEarnings,
      customerName: service.customer.user.name,
      address: {
        street: service.customer.address?.street,
        city: service.customer.address?.city,
        state: service.customer.address?.state,
        zipCode: service.customer.address?.zipCode
      },
      servicePlan: {
        name: service.servicePlan.name,
        duration: service.servicePlan.duration
      },
      gateCode: service.customer.gateCode
    }));

    return NextResponse.json({
      services: formattedServices,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching available services:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available services' },
      { status: 500 }
    )
  }
}) 