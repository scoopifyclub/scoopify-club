import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { withDatabase } from '@/middleware/db';
import { requireAuth } from '@/lib/api-auth';

const handler = async (req: Request) => {
  try {
    const user = await requireAuth(req as any);
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const where = {
      scheduledDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      ...(user.role === 'CUSTOMER' && { customerId: user.customerId }),
      ...(user.role === 'EMPLOYEE' && { employeeId: user.employeeId }),
    };

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
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
        orderBy: {
          scheduledDate: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.service.count({ where }),
    ]);

    return NextResponse.json({
      services,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching service history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service history' },
      { status: 500 }
    );
  }
};

export const GET = withDatabase(handler); 