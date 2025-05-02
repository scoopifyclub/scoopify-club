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

    const [
      totalServices,
      completedServices,
      cancelledServices,
      averageRating,
      recentServices
    ] = await Promise.all([
      prisma.service.count({
        where: { employeeId }
      }),
      prisma.service.count({
        where: { employeeId, status: 'COMPLETED' }
      }),
      prisma.service.count({
        where: { employeeId, status: 'CANCELLED' }
      }),
      prisma.service.aggregate({
        where: { employeeId, rating: { not: null } },
        _avg: { rating: true }
      }),
      prisma.service.findMany({
        where: { employeeId },
        take: 5,
        orderBy: { scheduledDate: 'desc' },
        include: {
          customer: {
            include: { user: true }
          }
        }
      })
    ]);

    return NextResponse.json({
      totalServices,
      completedServices,
      cancelledServices,
      averageRating: averageRating._avg.rating || 0,
      recentServices
    });
  } catch (error) {
    console.error('Error fetching employee metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee metrics' },
      { status: 500 }
    );
  }
}
