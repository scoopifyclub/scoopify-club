import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import prisma from "@/lib/prisma";
import { geocodeZipCode } from '@/lib/geocoding';

export async function POST(request, { params }: { params: Promise<any> }) {
  try {
    // Extract the employeeId from params
    const { employeeId } = await params;

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

    const { zipCode, radius, isPrimary } = await request.json();

    // Validate zip code format
    if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
      return NextResponse.json({ error: 'Invalid zip code format' }, { status: 400 });
    }

    // Validate radius
    if (radius < 0 || radius > 100) {
      return NextResponse.json({ error: 'Radius must be between 0 and 100 miles' }, { status: 400 });
    }

    // Geocode the zip code to get coordinates
    const coordinates = await geocodeZipCode(zipCode);
    if (!coordinates) {
      return NextResponse.json({ error: 'Could not geocode zip code' }, { status: 400 });
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request, { params }: { params: Promise<any> }) {
  try {
    // Extract the employeeId from params
    const { employeeId } = await params;

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

    const serviceAreas = await prisma.serviceArea.findMany({
      where: { employeeId },
    });

    return NextResponse.json(serviceAreas);
  } catch (error) {
    console.error('Error fetching service areas:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 