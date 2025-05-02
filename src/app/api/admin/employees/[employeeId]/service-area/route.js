import { requireRole } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const user = await requireRole('ADMIN');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { employeeId } = params;

    const serviceArea = await prisma.serviceArea.findFirst({
      where: { employeeId },
      include: {
        employee: {
          include: { user: true }
        }
      }
    });

    return NextResponse.json(serviceArea);
  } catch (error) {
    console.error('Error fetching service area:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service area' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await requireRole('ADMIN');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { employeeId } = params;
    const data = await request.json();

    const serviceArea = await prisma.serviceArea.update({
      where: { employeeId },
      data,
      include: {
        employee: {
          include: { user: true }
        }
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
