import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import prisma from "@/lib/prisma";



export async function PATCH(
  request: Request,
  { params }: { params: { employeeId: string } }
) {
  try {
    // Get access token from cookies
const cookieStore = await cookies();
const accessToken = cookieStore.get('accessToken')?.value;

if (!accessToken) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Validate the token and check role
const { userId, role } = await validateUser(accessToken);
    if (!session?.user || role !== 'ADMIN') {
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