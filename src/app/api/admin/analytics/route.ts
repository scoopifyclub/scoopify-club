import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = new Date(searchParams.get('start') || new Date().setDate(new Date().getDate() - 30));
    const endDate = new Date(searchParams.get('end') || new Date());

    // Revenue Analysis
    const subscriptions = await prisma.subscription.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        plan: true
      }
    });

    const oneTimeServices = await prisma.service.findMany({
      where: {
        scheduledFor: {
          gte: startDate,
          lte: endDate
        },
        customer: {
          subscription: null
        }
      }
    });

    // Customer Analysis
    const activeCustomers = await prisma.customer.count({
      where: {
        status: 'ACTIVE',
        user: {
          isActive: true
        }
      }
    });

    const churnedCustomers = await prisma.customer.count({
      where: {
        status: 'INACTIVE',
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const totalCustomers = activeCustomers + churnedCustomers;

    // Service Analysis
    const services = await prisma.service.findMany({
      where: {
        scheduledFor: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Employee Performance
    const employees = await prisma.employee.findMany({
      where: {
        user: {
          isActive: true
        }
      },
      include: {
        services: {
          where: {
            scheduledFor: {
              gte: startDate,
              lte: endDate
            }
          }
        },
        user: {
          select: {
            name: true
          }
        }
      }
    });

    // Calculate daily data
    const dailyData = getDailyData(startDate, endDate, services, subscriptions);

    // Calculate employee performance metrics
    const employeePerformance = employees.map(employee => {
      const completedServices = employee.services.filter(s => s.status === 'COMPLETED');
      const totalDuration = completedServices.reduce((total, service) => {
        if (service.arrivedAt && service.completedAt) {
          return total + (new Date(service.completedAt).getTime() - new Date(service.arrivedAt).getTime()) / 1000 / 60;
        }
        return total;
      }, 0);

      return {
        name: employee.user.name,
        completedJobs: completedServices.length,
        avgDuration: completedServices.length > 0 ? Math.round(totalDuration / completedServices.length) : 0,
        rating: 4.5, // TODO: Implement actual rating system
        revenue: completedServices.length * 100 // TODO: Implement actual revenue calculation
      };
    });

    const analytics = {
      revenue: {
        total: calculateTotalRevenue(subscriptions, oneTimeServices),
        recurring: calculateRecurringRevenue(subscriptions),
        oneTime: calculateOneTimeRevenue(oneTimeServices),
        dailyData: dailyData.revenue
      },
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        churned: churnedCustomers,
        retentionRate: activeCustomers / (activeCustomers + churnedCustomers),
        acquisitionData: dailyData.customers
      },
      services: {
        total: services.length,
        completed: services.filter(s => s.status === 'COMPLETED').length,
        cancelled: services.filter(s => s.status === 'CANCELLED').length,
        dailyData: dailyData.services
      },
      employees: {
        performance: employeePerformance
      }
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

function getDailyData(startDate: Date, endDate: Date, services: any[], subscriptions: any[]) {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const dailyData = {
    revenue: [],
    customers: [],
    services: []
  };

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Filter services and subscriptions for the current day
    const dayServices = services.filter(s => 
      new Date(s.scheduledFor) >= currentDate && 
      new Date(s.scheduledFor) < nextDate
    );

    const daySubscriptions = subscriptions.filter(s => 
      new Date(s.createdAt) >= currentDate && 
      new Date(s.createdAt) < nextDate
    );

    // Calculate metrics for the day
    const completed = dayServices.filter(s => s.status === 'COMPLETED').length;
    const cancelled = dayServices.filter(s => s.status === 'CANCELLED').length;
    const avgDuration = calculateAverageDuration(dayServices);

    const recurringRevenue = calculateRecurringRevenue(daySubscriptions);
    const oneTimeRevenue = calculateOneTimeRevenue(dayServices);

    const dateStr = currentDate.toISOString().split('T')[0];

    // Add revenue data
    dailyData.revenue.push({
      date: dateStr,
      total: recurringRevenue + oneTimeRevenue,
      recurring: recurringRevenue,
      oneTime: oneTimeRevenue
    });

    // Add customer data
    dailyData.customers.push({
      date: dateStr,
      new: daySubscriptions.length,
      churned: dayServices.filter(s => s.status === 'CANCELLED').length
    });

    // Add service data
    dailyData.services.push({
      date: dateStr,
      total: dayServices.length,
      completed,
      cancelled,
      avgDuration
    });
  }

  return dailyData;
}

function calculateTotalRevenue(subscriptions: any[], oneTimeServices: any[]) {
  const recurringRevenue = calculateRecurringRevenue(subscriptions);
  const oneTimeRevenue = calculateOneTimeRevenue(oneTimeServices);
  return recurringRevenue + oneTimeRevenue;
}

function calculateRecurringRevenue(subscriptions: any[]) {
  return subscriptions.reduce((total, sub) => total + (sub.plan?.price || 0), 0);
}

function calculateOneTimeRevenue(services: any[]) {
  return services.filter(s => s.status === 'COMPLETED').length * 100; // Assuming $100 per service
}

function calculateAverageDuration(services: any[]) {
  const completedServices = services.filter(s => 
    s.status === 'COMPLETED' && s.arrivedAt && s.completedAt
  );

  if (completedServices.length === 0) return 0;

  const totalDuration = completedServices.reduce((total, service) => {
    const duration = new Date(service.completedAt).getTime() - new Date(service.arrivedAt).getTime();
    return total + (duration / 1000 / 60); // Convert to minutes
  }, 0);

  return Math.round(totalDuration / completedServices.length);
} 