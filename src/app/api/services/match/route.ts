import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Helper function to calculate distance between two zip codes
// This is a simplified version - in production, you'd want to use a proper geocoding service
async function getDistance(zip1: string, zip2: string): Promise<number> {
  // In a real implementation, you would:
  // 1. Use a geocoding service to get lat/long for zip codes
  // 2. Calculate actual distance using the Haversine formula
  // For now, we'll return a mock distance
  return Math.abs(parseInt(zip1) - parseInt(zip2)) / 100;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { serviceId } = await request.json();

    // Get the service details
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

    if (!service || !service.subscription?.customer?.address?.zipCode) {
      return new NextResponse('Service or customer address not found', { status: 404 });
    }

    const customerZip = service.subscription.customer.address.zipCode;

    // Get all available employees
    const employees = await prisma.employee.findMany({
      where: {
        isAvailable: true
      },
      select: {
        id: true,
        name: true,
        zipCode: true,
        serviceRadius: true
      }
    });

    // Match employees based on distance
    const matchedEmployees = await Promise.all(
      employees.map(async (employee) => {
        if (!employee.zipCode) return null;
        
        const distance = await getDistance(customerZip, employee.zipCode);
        if (distance <= employee.serviceRadius) {
          return {
            ...employee,
            distance
          };
        }
        return null;
      })
    );

    // Filter out null values and sort by distance
    const validMatches = matchedEmployees
      .filter((match): match is NonNullable<typeof match> => match !== null)
      .sort((a, b) => a.distance - b.distance);

    return NextResponse.json({
      matches: validMatches,
      customerZip,
      totalMatches: validMatches.length
    });

  } catch (error) {
    console.error('Error matching service:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 