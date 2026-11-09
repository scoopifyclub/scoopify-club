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

    const serviceArea = await prisma.serviceArea.findFirst({
      where: { employeeId },
      include: {
        employee: {
          include: { User: true }
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
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { employeeId } = params;
    const data = await request.json();

    const serviceArea = await prisma.serviceArea.update({
      where: { employeeId },
      data,
      include: {
        employee: {
          include: { User: true }
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
