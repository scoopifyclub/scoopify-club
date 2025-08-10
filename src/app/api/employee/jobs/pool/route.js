import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/api-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


export async function GET(request) {
  const { userId } = getUserFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get employee with their service areas
    const employee = await prisma.employee.findUnique({
      where: { userId },
      include: {
        serviceAreas: {
          where: { active: true }
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Get employee's active service area zip codes
    const employeeZipCodes = employee.serviceAreas.map(area => area.zipCode);

    if (employeeZipCodes.length === 0) {
      return NextResponse.json([]);
    }

    // Find available services in employee's service areas
    const availableServices = await prisma.service.findMany({
      where: {
        status: 'SCHEDULED',
        employeeId: null, // Not assigned to anyone yet
        customer: {
          address: {
            zipCode: {
              in: employeeZipCodes
            }
          }
        }
      },
      include: {
        customer: {
          include: {
            User: {
              select: {
                name: true,
                email: true
              }
            },
            address: true
          }
        },
        servicePlan: true
      },
      orderBy: {
        scheduledDate: 'asc'
      }
    });

    // Transform the data for the frontend
    const jobs = availableServices.map(service => ({
      id: service.id,
      customerName: service.customer.User?.name || 'Unknown Customer',
      customerEmail: service.customer.User?.email,
      address: service.customer.address ? {
        street: service.customer.address.street,
        city: service.customer.address.city,
        state: service.customer.address.state,
        zipCode: service.customer.address.zipCode
      } : null,
      scheduledDate: service.scheduledDate,
      serviceType: service.servicePlan?.name || 'Standard Service',
      potentialEarnings: service.potentialEarnings || 0,
      estimatedDuration: service.servicePlan?.estimatedDuration || 30,
      specialInstructions: service.customer.gateCode ? `Gate Code: ${service.customer.gateCode}` : null
    }));

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching job pool:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available jobs' },
      { status: 500 }
    );
  }
} 