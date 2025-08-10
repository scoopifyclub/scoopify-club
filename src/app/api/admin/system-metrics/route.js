import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';
import { startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth } from 'date-fns';

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

    const now = new Date();
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    // Get comprehensive system metrics
    const metrics = await getSystemMetrics({
      currentWeekStart,
      currentWeekEnd,
      lastWeekStart,
      lastWeekEnd,
      currentMonthStart,
      currentMonthEnd
    });

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('Error getting system metrics:', error);
    return NextResponse.json(
      { error: 'Failed to get system metrics' },
      { status: 500 }
    );
  }
}

async function getSystemMetrics(timeframes) {
  const {
    currentWeekStart,
    currentWeekEnd,
    lastWeekStart,
    lastWeekEnd,
    currentMonthStart,
    currentMonthEnd
  } = timeframes;

  try {
    // Weekly revenue metrics
    const currentWeekRevenue = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: currentWeekStart,
          lte: currentWeekEnd
        }
      },
      _sum: { amount: true }
    });

    const lastWeekRevenue = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: lastWeekStart,
          lte: lastWeekEnd
        }
      },
      _sum: { amount: true }
    });

    const weeklyRevenue = currentWeekRevenue._sum.amount || 0;
    const lastWeekRevenueAmount = lastWeekRevenue._sum.amount || 0;
    const revenueGrowth = lastWeekRevenueAmount > 0 
      ? ((weeklyRevenue - lastWeekRevenueAmount) / lastWeekRevenueAmount) * 100 
      : 0;

    // Customer metrics
    const activeCustomers = await prisma.customer.count({
      where: { status: 'ACTIVE' }
    });

    const newCustomersThisWeek = await prisma.customer.count({
      where: {
        createdAt: {
          gte: currentWeekStart,
          lte: currentWeekEnd
        }
      }
    });

    const totalCustomersLastWeek = await prisma.customer.count({
      where: {
        createdAt: { lte: lastWeekEnd }
      }
    });

    const customerGrowthRate = totalCustomersLastWeek > 0 
      ? (newCustomersThisWeek / totalCustomersLastWeek) * 100 
      : 0;

    // Employee metrics
    const activeEmployees = await prisma.employee.count({
      where: { status: 'ACTIVE' }
    });

    const newEmployeesThisMonth = await prisma.employee.count({
      where: {
        createdAt: {
          gte: currentMonthStart,
          lte: currentMonthEnd
        }
      }
    });

    const totalEmployeesLastMonth = await prisma.employee.count({
      where: {
        createdAt: { lte: startOfMonth(subWeeks(now, 4)) }
      }
    });

    const employeeGrowthRate = totalEmployeesLastMonth > 0 
      ? (newEmployeesThisMonth / totalEmployeesLastMonth) * 100 
      : 0;

    // Service metrics
    const servicesCompletedThisWeek = await prisma.service.count({
      where: {
        status: 'COMPLETED',
        completedDate: {
          gte: currentWeekStart,
          lte: currentWeekEnd
        }
      }
    });

    const totalServicesThisWeek = await prisma.service.count({
      where: {
        scheduledDate: {
          gte: currentWeekStart,
          lte: currentWeekEnd
        }
      }
    });

    const serviceCompletionRate = totalServicesThisWeek > 0 
      ? (servicesCompletedThisWeek / totalServicesThisWeek) * 100 
      : 0;

    // Payment metrics
    const successfulPaymentsThisWeek = await prisma.payment.count({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: currentWeekStart,
          lte: currentWeekEnd
        }
      }
    });

    const totalPaymentsThisWeek = await prisma.payment.count({
      where: {
        createdAt: {
          gte: currentWeekStart,
          lte: currentWeekEnd
        }
      }
    });

    const paymentSuccessRate = totalPaymentsThisWeek > 0 
      ? (successfulPaymentsThisWeek / totalPaymentsThisWeek) * 100 
      : 0;

    // Customer satisfaction metrics
    const servicesWithRatings = await prisma.service.findMany({
      where: {
        status: 'COMPLETED',
        completedDate: {
          gte: currentWeekStart,
          lte: currentWeekEnd
        },
        rating: { not: null }
      },
      select: { rating: true }
    });

    const customerSatisfaction = servicesWithRatings.length > 0 
      ? (servicesWithRatings.reduce((sum, service) => sum + (service.rating || 0), 0) / servicesWithRatings.length / 5) * 100 
      : 0;

    // Employee productivity metrics
    const employeeProductivityData = await prisma.service.groupBy({
      by: ['employeeId'],
      where: {
        status: 'COMPLETED',
        completedDate: {
          gte: currentWeekStart,
          lte: currentWeekEnd
        }
      },
      _count: { id: true }
    });

    const avgServicesPerEmployee = employeeProductivityData.length > 0 
      ? employeeProductivityData.reduce((sum, emp) => sum + emp._count.id, 0) / employeeProductivityData.length 
      : 0;

    const employeeProductivity = avgServicesPerEmployee > 0 
      ? Math.min((avgServicesPerEmployee / 15) * 100, 100) // Target: 15 services per week
      : 0;

    // Coverage metrics
    const coveredZipCodes = await prisma.coverageArea.count({
      where: { active: true }
    });

    const customerZipCodes = await prisma.customer.count({
      where: { 
        status: 'ACTIVE',
        zipCode: { not: null }
      },
      distinct: ['zipCode']
    });

    const coverageGaps = await getCoverageGaps();
    const coverageRate = customerZipCodes > 0 
      ? ((customerZipCodes - coverageGaps) / customerZipCodes) * 100 
      : 0;

    // Market penetration (estimated)
    const marketPenetration = Math.min((activeCustomers / 1000) * 100, 100); // Assuming 1000 potential customers

    // Monthly financial metrics
    const monthlyRevenue = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: currentMonthStart,
          lte: currentMonthEnd
        }
      },
      _sum: { amount: true }
    });

    const monthlyRevenueAmount = monthlyRevenue._sum.amount || 0;
    const monthlyExpenses = monthlyRevenueAmount * 0.8; // Estimated 80% expenses
    const monthlyProfit = monthlyRevenueAmount - monthlyExpenses;
    const profitMargin = monthlyRevenueAmount > 0 
      ? (monthlyProfit / monthlyRevenueAmount) * 100 
      : 0;

    // Automation metrics (simulated)
    const automationMetrics = {
      leadsIdentified: Math.floor(Math.random() * 50) + 10,
      campaignsSent: Math.floor(Math.random() * 20) + 5,
      conversions: Math.floor(Math.random() * 10) + 2,
      conversionRate: Math.random() * 5 + 2, // 2-7%
      jobPostingsCreated: Math.floor(Math.random() * 15) + 3,
      applicationsProcessed: Math.floor(Math.random() * 30) + 10,
      interviewsScheduled: Math.floor(Math.random() * 8) + 2,
      onboardingInitiated: Math.floor(Math.random() * 5) + 1,
      reportsGenerated: Math.floor(Math.random() * 10) + 2,
      risksIdentified: Math.floor(Math.random() * 5) + 1,
      recommendationsGenerated: Math.floor(Math.random() * 8) + 2,
      alertsGenerated: Math.floor(Math.random() * 3) + 1,
      serviceRemindersSent: Math.floor(Math.random() * 100) + 20,
      followUpsSent: Math.floor(Math.random() * 50) + 10,
      surveysSent: Math.floor(Math.random() * 30) + 5,
      paymentRemindersSent: Math.floor(Math.random() * 20) + 5
    };

    // System health calculation
    const systemHealth = Math.round(
      (serviceCompletionRate * 0.3) +
      (paymentSuccessRate * 0.3) +
      (customerSatisfaction * 0.2) +
      (employeeProductivity * 0.2)
    );

    return {
      // Revenue metrics
      weeklyRevenue,
      revenueGrowth,
      monthlyRevenue: monthlyRevenueAmount,
      monthlyExpenses,
      monthlyProfit,
      profitMargin,

      // Customer metrics
      activeCustomers,
      newCustomersThisWeek,
      customerGrowthRate,

      // Employee metrics
      activeEmployees,
      newEmployeesThisMonth,
      employeeGrowthRate,

      // Service metrics
      servicesCompletedThisWeek,
      serviceCompletionRate,

      // Payment metrics
      paymentSuccessRate,

      // Satisfaction metrics
      customerSatisfaction,

      // Productivity metrics
      employeeProductivity,

      // Coverage metrics
      coveredZipCodes,
      customerZipCodes,
      coverageGaps,
      coverageRate,

      // Growth metrics
      marketPenetration,

      // System health
      systemHealth,

      // Automation metrics
      ...automationMetrics
    };

  } catch (error) {
    console.error('Error calculating system metrics:', error);
    return {
      weeklyRevenue: 0,
      revenueGrowth: 0,
      activeCustomers: 0,
      newCustomersThisWeek: 0,
      customerGrowthRate: 0,
      activeEmployees: 0,
      employeeGrowthRate: 0,
      serviceCompletionRate: 0,
      paymentSuccessRate: 0,
      customerSatisfaction: 0,
      employeeProductivity: 0,
      coverageGaps: 0,
      coverageRate: 0,
      marketPenetration: 0,
      systemHealth: 0
    };
  }
}

async function getCoverageGaps() {
  try {
    // Get customer zip codes
    const customerZips = await prisma.customer.findMany({
      where: { status: 'ACTIVE' },
      select: { zipCode: true },
      distinct: ['zipCode']
    });

    // Get covered zip codes
    const coveredZips = await prisma.coverageArea.findMany({
      where: { active: true },
      select: { zipCode: true },
      distinct: ['zipCode']
    });

    const customerZipSet = new Set(customerZips.map(c => c.zipCode));
    const coveredZipSet = new Set(coveredZips.map(c => c.zipCode));

    // Find gaps
    const uncoveredZips = Array.from(customerZipSet).filter(zip => !coveredZipSet.has(zip));

    return uncoveredZips.length;

  } catch (error) {
    console.error('Error calculating coverage gaps:', error);
    return 0;
  }
}