import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
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

    // Get analytics data
    const [
      totalCustomers,
      totalEmployees,
      totalServices,
      recentServices,
      recentCustomers,
      recentEmployees,
      servicesByStatus,
      employeesByStatus
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.employee.count(),
      prisma.service.count(),
      prisma.service.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            include: { User: true }
          },
          employee: {
            include: { User: true }
          }
        }
      }),
      prisma.customer.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { User: true }
      }),
      prisma.employee.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { User: true }
      }),
      prisma.service.groupBy({
        by: ['status'],
        _count: true
      }),
      prisma.employee.groupBy({
        by: ['status'],
        _count: true
      })
    ]);

    return NextResponse.json({
      totalCustomers,
      totalEmployees,
      totalServices,
      recentServices,
      recentCustomers,
      recentEmployees,
      servicesByStatus,
      employeesByStatus
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
