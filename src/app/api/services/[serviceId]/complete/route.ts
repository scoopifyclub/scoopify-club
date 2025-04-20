import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { withDatabase } from '@/middleware/db';
import { requireAuth } from '@/lib/api-auth';

const handler = async (req: Request, { params }: { params: { serviceId: string } }) => {
  try {
    const user = await requireAuth(req as any);
    const { serviceId } = params;

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

    // Only employees can complete services
    if (user.role !== 'EMPLOYEE' || service.employeeId !== user.employeeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notes, photos } = await req.json();

    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        notes,
        photos: photos || [],
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
    console.error('Error completing service:', error);
    return NextResponse.json(
      { error: 'Failed to complete service' },
      { status: 500 }
    );
  }
};

export const POST = withDatabase(handler); 