import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/api-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


export async function GET(request) {
  const { userId } = getUserFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week'; // week, month, year, all
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Calculate date range based on period
    let dateFilter = {};
    const now = new Date();
    
    if (startDate && endDate) {
      dateFilter = {
        completedDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    } else {
      switch (period) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = {
            completedDate: {
              gte: weekAgo
            }
          };
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateFilter = {
            completedDate: {
              gte: monthAgo
            }
          };
          break;
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          dateFilter = {
            completedDate: {
              gte: yearAgo
            }
          };
          break;
        case 'all':
        default:
          // No date filter for 'all'
          break;
      }
    }

    // Get completed services for the employee
    const completedServices = await prisma.service.findMany({
      where: {
        employeeId: employee.id,
        status: 'COMPLETED',
        ...dateFilter
      },
      include: {
        customer: {
          include: {
            User: {
              select: {
                name: true
              }
            }
          }
        },
        servicePlan: true
      },
      orderBy: {
        completedDate: 'desc'
      }
    });

    // Calculate earnings
    const totalEarnings = completedServices.reduce((sum, service) => {
      return sum + (service.potentialEarnings || 0);
    }, 0);

    const totalServices = completedServices.length;
    const averageEarnings = totalServices > 0 ? totalEarnings / totalServices : 0;

    // Group by date for chart data
    const earningsByDate = {};
    completedServices.forEach(service => {
      const date = service.completedDate.toISOString().split('T')[0];
      if (!earningsByDate[date]) {
        earningsByDate[date] = 0;
      }
      earningsByDate[date] += service.potentialEarnings || 0;
    });

    // Get pending payments
    const pendingServices = await prisma.service.findMany({
      where: {
        employeeId: employee.id,
        status: 'COMPLETED',
        paymentStatus: 'PENDING'
      }
    });

    const pendingEarnings = pendingServices.reduce((sum, service) => {
      return sum + (service.potentialEarnings || 0);
    }, 0);

    // Get paid services
    const paidServices = await prisma.service.findMany({
      where: {
        employeeId: employee.id,
        status: 'COMPLETED',
        paymentStatus: 'PAID'
      }
    });

    const paidEarnings = paidServices.reduce((sum, service) => {
      return sum + (service.potentialEarnings || 0);
    }, 0);

    return NextResponse.json({
      summary: {
        totalEarnings,
        totalServices,
        averageEarnings: Math.round(averageEarnings * 100) / 100,
        pendingEarnings,
        paidEarnings
      },
      services: completedServices.map(service => ({
        id: service.id,
        customerName: service.customer.User?.name || 'Unknown Customer',
        completedDate: service.completedDate,
        earnings: service.potentialEarnings || 0,
        serviceType: service.servicePlan?.name || 'Standard Service',
        paymentStatus: service.paymentStatus
      })),
      chartData: Object.entries(earningsByDate).map(([date, earnings]) => ({
        date,
        earnings
      })).sort((a, b) => a.date.localeCompare(b.date))
    });

  } catch (error) {
    console.error('Error fetching earnings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earnings' },
      { status: 500 }
    );
  }
} 