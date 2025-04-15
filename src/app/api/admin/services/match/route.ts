import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getDistance } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { serviceId } = await request.json();

    // Get service details including customer address
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        subscription: {
          include: {
            customer: {
              include: {
                address: true
              }
            }
          }
        }
      }
    });

    if (!service) {
      return new NextResponse('Service not found', { status: 404 });
    }

    // Check if customer has failed payments
    const customer = service.subscription.customer;
    if (customer.status === 'PAST_DUE') {
      return new NextResponse('Customer has failed payments', { status: 400 });
    }

    const customerAddress = customer.address;
    if (!customerAddress) {
      return new NextResponse('Customer address not found', { status: 404 });
    }

    // Get all active employees with their service areas
    const employees = await prisma.employee.findMany({
      where: {
        isActive: true,
        serviceAreas: {
          some: {
            isPrimary: true
          }
        }
      },
      include: {
        serviceAreas: true
      }
    });

    // Match employees based on distance
    const matchedEmployees = employees
      .map(employee => {
        const primaryArea = employee.serviceAreas.find(area => area.isPrimary);
        if (!primaryArea) return null;

        const distance = getDistance(
          customerAddress.zipCode,
          primaryArea.zipCode
        );

        if (distance <= primaryArea.radius) {
          return {
            id: employee.id,
            name: employee.name,
            distance,
            zipCode: primaryArea.zipCode,
            serviceRadius: primaryArea.radius
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => a!.distance - b!.distance);

    return NextResponse.json({
      matchedEmployees,
      customerZipCode: customerAddress.zipCode,
      totalMatches: matchedEmployees.length
    });
  } catch (error) {
    console.error('Error matching service:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 