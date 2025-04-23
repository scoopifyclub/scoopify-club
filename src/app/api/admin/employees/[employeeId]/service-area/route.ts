import { NextResponse, NextRequest } from 'next/server';
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import prisma from "@/lib/prisma";

// Define the PATCH handler with proper Next.js API route typing
export async function PATCH(
  request: NextRequest,
  context: { params: { employeeId: string } }
) {
  try {
    // Extract the employeeId from params
    const { employeeId } = context.params;

    // Get access token from cookies
    const cookieStore = cookies();
    const accessToken = cookieStore.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate the token and check role
    try {
      const userData = await validateUser(accessToken);
      if (userData.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized, admin access required' }, { status: 401 });
      }
    } catch (err) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Parse request body
    const { zipCode, serviceRadius, isAvailable } = await request.json();

    // Validate zip code format (basic validation)
    if (zipCode && !/^\d{5}(-\d{4})?$/.test(zipCode)) {
      return NextResponse.json({ error: 'Invalid zip code format' }, { status: 400 });
    }

    // Validate service radius
    if (serviceRadius && (serviceRadius < 0 || serviceRadius > 100)) {
      return NextResponse.json({ error: 'Service radius must be between 0 and 100 miles' }, { status: 400 });
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 