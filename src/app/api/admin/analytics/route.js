import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

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
            include: { user: true }
          },
          employee: {
            include: { user: true }
          }
        }
      }),
      prisma.customer.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: true }
      }),
      prisma.employee.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: true }
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
