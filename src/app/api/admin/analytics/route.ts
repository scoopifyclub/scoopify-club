import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { parseISO, format, differenceInDays, addDays, subDays } from 'date-fns';

// Helper to generate random numbers within a range
const randomInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDecimal = (min: number, max: number) => +(Math.random() * (max - min) + min).toFixed(2);

export async function GET(request: Request) {
  try {
    // Verify admin authorization
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const startParam = url.searchParams.get('start');
    const endParam = url.searchParams.get('end');
    
    // Default to last 30 days if no dates provided
    const end = endParam ? parseISO(endParam) : new Date();
    const start = startParam ? parseISO(startParam) : subDays(end, 30);
    
    // Calculate the date range
    const dayCount = differenceInDays(end, start) + 1;
    
    // Generate daily data for the charts
    const dailyRevenueData = [];
    const dailyCustomerData = [];
    const dailyServiceData = [];
    
    let totalRevenue = 0;
    let recurringRevenue = 0;
    let oneTimeRevenue = 0;
    let newCustomers = 0;
    let churnedCustomers = 0;
    let totalServices = 0;
    let completedServices = 0;
    let cancelledServices = 0;
    
    for (let i = 0; i < dayCount; i++) {
      const currentDate = addDays(start, i);
      const dateStr = format(currentDate, 'MMM dd');
      
      // Generate revenue data for this day
      const dailyRecurring = randomInRange(500, 2000);
      const dailyOneTime = randomInRange(100, 1000);
      const dailyTotal = dailyRecurring + dailyOneTime;
      
      recurringRevenue += dailyRecurring;
      oneTimeRevenue += dailyOneTime;
      totalRevenue += dailyTotal;
      
      dailyRevenueData.push({
        date: dateStr,
        total: dailyTotal,
        recurring: dailyRecurring,
        oneTime: dailyOneTime
      });
      
      // Generate customer data for this day
      const dailyNew = randomInRange(1, 10);
      const dailyChurned = randomInRange(0, 5);
      
      newCustomers += dailyNew;
      churnedCustomers += dailyChurned;
      
      dailyCustomerData.push({
        date: dateStr,
        new: dailyNew,
        churned: dailyChurned
      });
      
      // Generate service data for this day
      const serviceDailyTotal = randomInRange(10, 30);
      const dailyCompleted = randomInRange(Math.floor(serviceDailyTotal * 0.7), serviceDailyTotal);
      const dailyCancelled = randomInRange(0, serviceDailyTotal - dailyCompleted);
      
      totalServices += serviceDailyTotal;
      completedServices += dailyCompleted;
      cancelledServices += dailyCancelled;
      
      dailyServiceData.push({
        date: dateStr,
        total: serviceDailyTotal,
        completed: dailyCompleted,
        cancelled: dailyCancelled,
        avgDuration: randomInRange(30, 60)
      });
    }
    
    // Generate employee performance data
    const employeeNames = ['John Smith', 'Sarah Johnson', 'Michael Williams', 'Jessica Brown', 'David Miller'];
    const employeePerformance = employeeNames.map(name => ({
      name,
      completedJobs: randomInRange(10, 100),
      avgDuration: randomInRange(30, 60),
      rating: randomDecimal(3.5, 5),
      revenue: randomInRange(1000, 5000)
    }));
    
    // Calculate retention rate
    const activeCustomers = 100 + newCustomers - churnedCustomers;
    const retentionRate = Math.min(1, Math.max(0, 1 - (churnedCustomers / (100 + newCustomers))));
    
    // Assemble the analytics object
    const analytics = {
      revenue: {
        total: totalRevenue,
        recurring: recurringRevenue,
        oneTime: oneTimeRevenue,
        dailyData: dailyRevenueData
      },
      customers: {
        total: 100 + newCustomers,
        active: activeCustomers,
        churned: churnedCustomers,
        retentionRate,
        acquisitionData: dailyCustomerData
      },
      services: {
        total: totalServices,
        completed: completedServices,
        cancelled: cancelledServices,
        dailyData: dailyServiceData
      },
      employees: {
        performance: employeePerformance
      }
    };
    
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error generating analytics:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics data' },
      { status: 500 }
    );
  }
} 