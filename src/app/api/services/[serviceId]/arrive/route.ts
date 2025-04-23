import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { withDatabase } from '@/middleware/db';
import { requireAuth } from '@/lib/api-auth';

const handler = async (req: Request, { params }: { params: Promise<{ serviceId: string }> }) => {
  try {
    const user = await requireAuth(req as any);
    const { serviceId } = await params;

    // Only employees can mark arrival
    if (user.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        employee: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (service.employeeId !== user.employeeId) {
      return NextResponse.json(
        { error: 'You are not assigned to this service' },
        { status: 401 }
      );
    }

    if (service.status !== 'CLAIMED') {
      return NextResponse.json(
        { error: 'Service must be claimed before marking arrival' },
        { status: 400 }
      );
    }

    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        employee: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Error marking service arrival:', error);
    return NextResponse.json(
      { error: 'Failed to mark service arrival' },
      { status: 500 }
    );
  }
};

export const POST = withDatabase(handler); 