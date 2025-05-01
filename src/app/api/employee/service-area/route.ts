import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { userId },
      include: { serviceAreas: true }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json(employee.serviceAreas);
  } catch (error) {
    console.error('Error fetching service areas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service areas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { zipCode, travelRange } = await request.json();

    // Validate zip code format
    if (!/^[0-9]{5}$/.test(zipCode)) {
      return NextResponse.json(
        { error: 'Invalid zip code format' },
        { status: 400 }
      );
    }

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { userId },
      include: { serviceAreas: true }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Check if service area already exists
    const existingArea = employee.serviceAreas.find(
      area => area.zipCode === zipCode
    );

    if (existingArea) {
      return NextResponse.json(
        { error: 'Service area already exists' },
        { status: 400 }
      );
    }

    // Create new service area
    const serviceArea = await prisma.serviceArea.create({
      data: {
        employeeId: employee.id,
        zipCode,
        travelRange,
        active: true
      }
    });

    return NextResponse.json(serviceArea);
  } catch (error) {
    console.error('Error creating service area:', error);
    return NextResponse.json(
      { error: 'Failed to create service area' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, zipCode, travelRange, active } = await request.json();

    // Validate zip code format
    if (zipCode && !/^[0-9]{5}$/.test(zipCode)) {
      return NextResponse.json(
        { error: 'Invalid zip code format' },
        { status: 400 }
      );
    }

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Update service area
    const serviceArea = await prisma.serviceArea.update({
      where: { id },
      data: {
        employeeId: employee.id,
        zipCode,
        travelRange,
        active
      }
    });

    return NextResponse.json(serviceArea);
  } catch (error) {
    console.error('Error updating service area:', error);
    return NextResponse.json(
      { error: 'Failed to update service area' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await request.json();

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Delete service area
    await prisma.serviceArea.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service area:', error);
    return NextResponse.json(
      { error: 'Failed to delete service area' },
      { status: 500 }
    );
  }
}
