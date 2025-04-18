import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { geocodeZipCode } from '@/lib/geocoding';

export async function POST(
  request: Request,
  { params }: { params: { employeeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { employeeId } = params;
    const { zipCode, radius, isPrimary } = await request.json();

    // Validate zip code format
    if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
      return new NextResponse('Invalid zip code format', { status: 400 });
    }

    // Validate radius
    if (radius < 0 || radius > 100) {
      return new NextResponse('Radius must be between 0 and 100 miles', { status: 400 });
    }

    // Geocode the zip code to get coordinates
    const coordinates = await geocodeZipCode(zipCode);
    if (!coordinates) {
      return new NextResponse('Could not geocode zip code', { status: 400 });
    }

    // If this is being set as primary, unset any other primary areas
    if (isPrimary) {
      await prisma.serviceArea.updateMany({
        where: {
          employeeId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    const serviceArea = await prisma.serviceArea.create({
      data: {
        employeeId,
        zipCode,
        radius,
        isPrimary,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      },
    });

    return NextResponse.json(serviceArea);
  } catch (error) {
    console.error('Error creating service area:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { employeeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { employeeId } = params;
    const serviceAreas = await prisma.serviceArea.findMany({
      where: { employeeId },
    });

    return NextResponse.json(serviceAreas);
  } catch (error) {
    console.error('Error fetching service areas:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 