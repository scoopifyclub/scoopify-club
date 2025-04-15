import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: { employeeId: string; areaId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { employeeId, areaId } = params;
    const { zipCode, radius, isPrimary } = await request.json();

    // Validate zip code format if provided
    if (zipCode && !/^\d{5}(-\d{4})?$/.test(zipCode)) {
      return new NextResponse('Invalid zip code format', { status: 400 });
    }

    // Validate radius if provided
    if (radius !== undefined && (radius < 0 || radius > 100)) {
      return new NextResponse('Radius must be between 0 and 100 miles', { status: 400 });
    }

    // If this is being set as primary, unset any other primary areas
    if (isPrimary) {
      await prisma.serviceArea.updateMany({
        where: {
          employeeId,
          isPrimary: true,
          NOT: {
            id: areaId,
          },
        },
        data: {
          isPrimary: false,
        },
      });
    }

    const updatedArea = await prisma.serviceArea.update({
      where: { id: areaId },
      data: {
        ...(zipCode && { zipCode }),
        ...(radius !== undefined && { radius }),
        ...(isPrimary !== undefined && { isPrimary }),
      },
    });

    return NextResponse.json(updatedArea);
  } catch (error) {
    console.error('Error updating service area:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { employeeId: string; areaId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { areaId } = params;
    await prisma.serviceArea.delete({
      where: { id: areaId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting service area:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 