import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { withDatabase } from '@/middleware/db';
import { requireAuth } from '@/lib/api-auth';

const handler = async (req: Request, { params }: { params: Promise<{ serviceId: string }> }) => {
  try {
    const user = await requireAuth(req as any);
    const { serviceId } = await params;

    // Only employees can claim services
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

    if (service.status !== 'AVAILABLE') {
      return NextResponse.json(
        { error: 'Service is not available for claiming' },
        { status: 400 }
      );
    }

    if (service.employeeId) {
      return NextResponse.json(
        { error: 'Service is already claimed' },
        { status: 400 }
      );
    }

    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        employeeId: user.employeeId,
        status: 'CLAIMED',
        claimedAt: new Date(),
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
    console.error('Error claiming service:', error);
    return NextResponse.json(
      { error: 'Failed to claim service' },
      { status: 500 }
    );
  }
};

export const POST = withDatabase(handler); 