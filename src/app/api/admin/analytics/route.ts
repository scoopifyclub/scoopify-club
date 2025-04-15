import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const employeeId = searchParams.get('employeeId');

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Base where clause
    const whereClause = {
      scheduledDate: {
        gte: start,
        lte: end,
      },
      ...(employeeId && { employeeId }),
    };

    // Get services for the period
    const services = await prisma.service.findMany({
      where: whereClause,
      include: {
        employee: true,
        subscription: {
          include: {
            customer: true,
          },
        },
        timeExtensions: true,
        payments: true,
      },
    });

    // Calculate daily trends
    const dailyTrends = services.reduce((acc, service) => {
      const date = service.scheduledDate.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          total: 0,
          completed: 0,
          cancelled: 0,
          revenue: 0,
          timeExtensions: 0,
        };
      }
      acc[date].total++;
      if (service.status === 'COMPLETED') acc[date].completed++;
      if (service.status === 'CANCELLED') acc[date].cancelled++;
      acc[date].revenue += service.payments.reduce((sum, p) => sum + p.amount, 0);
      acc[date].timeExtensions += service.timeExtensions.length;
      return acc;
    }, {} as Record<string, any>);

    // Calculate employee performance
    const employeePerformance = services.reduce((acc, service) => {
      if (!acc[service.employeeId]) {
        acc[service.employeeId] = {
          name: service.employee.name,
          totalServices: 0,
          completedServices: 0,
          totalRevenue: 0,
          averageRating: 0,
          timeExtensions: 0,
        };
      }
      acc[service.employeeId].totalServices++;
      if (service.status === 'COMPLETED') {
        acc[service.employeeId].completedServices++;
        acc[service.employeeId].totalRevenue += service.payments.reduce((sum, p) => sum + p.amount, 0);
      }
      acc[service.employeeId].timeExtensions += service.timeExtensions.length;
      return acc;
    }, {} as Record<string, any>);

    // Format daily trends for chart
    const formattedTrends = Object.entries(dailyTrends).map(([date, data]) => ({
      date,
      ...data,
    }));

    return NextResponse.json({
      dailyTrends: formattedTrends,
      employeePerformance: Object.values(employeePerformance),
      totalRevenue: services.reduce((sum, s) => sum + s.payments.reduce((pSum, p) => pSum + p.amount, 0), 0),
      totalServices: services.length,
      completedServices: services.filter(s => s.status === 'COMPLETED').length,
      cancelledServices: services.filter(s => s.status === 'CANCELLED').length,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 