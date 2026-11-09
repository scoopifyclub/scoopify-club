import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { employeeId } = params;

    const serviceAreas = await prisma.serviceArea.findMany({
      where: { employeeId },
      include: {
        employee: {
          include: { User: true }
        }
      }
    });

    return NextResponse.json(serviceAreas);
  } catch (error) {
    console.error('Error fetching service areas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service areas' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { employeeId } = params;
    const data = await request.json();

    const serviceArea = await prisma.serviceArea.create({
      data: {
        ...data,
        employeeId
      },
      include: {
        employee: {
          include: { User: true }
        }
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

export async function DELETE(request, { params }) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { employeeId } = params;
    const { id } = await request.json();

    await prisma.serviceArea.delete({
      where: {
        id,
        employeeId
      }
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
