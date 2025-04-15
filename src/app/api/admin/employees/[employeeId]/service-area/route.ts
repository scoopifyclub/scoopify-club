import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: { employeeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { employeeId } = params;
    const { zipCode, serviceRadius, isAvailable } = await request.json();

    // Validate zip code format (basic validation)
    if (zipCode && !/^\d{5}(-\d{4})?$/.test(zipCode)) {
      return new NextResponse('Invalid zip code format', { status: 400 });
    }

    // Validate service radius
    if (serviceRadius && (serviceRadius < 0 || serviceRadius > 100)) {
      return new NextResponse('Service radius must be between 0 and 100 miles', { status: 400 });
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        ...(zipCode && { zipCode }),
        ...(serviceRadius !== undefined && { serviceRadius }),
        ...(isAvailable !== undefined && { isAvailable }),
      },
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error('Error updating employee service area:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 