import { requireRole } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const user = await requireRole('ADMIN');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      customersByStatus,
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
      prisma.customer.groupBy({
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
      customersByStatus,
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
