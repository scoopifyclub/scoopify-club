import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) {
      console.log('No access token found in cookies');
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }
    const decoded = await validateUserToken(token);
    console.log('Token verification result:', decoded ? 'success' : 'failed');
    if (!decoded || decoded.role !== 'ADMIN') {
      console.log('Invalid token or not admin:', decoded?.role);
      return NextResponse.json({ error: 'Unauthorized - Not admin' }, { status: 401 });
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
            include: { User: true }
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
