import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { addDays, startOfDay, endOfDay, isAfter, isBefore, setHours } from 'date-fns';
import { sendServiceNotificationEmail } from '@/lib/email';

// Map day names to numeric day values (0 = Sunday, 1 = Monday, etc.)
const dayMap = {
  'Sunday': 0,
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6
};

// Function to get the next occurrence of a specific day
function getNextDayOccurrence(dayName: string, fromDate: Date = new Date()): Date {
  const today = new Date(fromDate);
  const todayDay = today.getDay();
  const targetDay = dayMap[dayName as keyof typeof dayMap];
  
  // Calculate days to add
  let daysToAdd = targetDay - todayDay;
  if (daysToAdd <= 0) {
    // If target day is today or already passed this week, get next week's occurrence
    daysToAdd += 7;
  }
  
  // Create next occurrence date and set time to 7am
  const nextDate = addDays(today, daysToAdd);
  return setHours(startOfDay(nextDate), 7);
}

export async function POST(request: Request) {
  try {
    // Get API key from request header for authorization
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      rescheduled: 0,
      scheduled: 0,
      errors: [] as string[]
    };

    // Step 1: Handle unclaimed services from previous day
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const unclaimedServices = await prisma.service.findMany({
      where: {
        status: 'SCHEDULED',
        employeeId: null,
        scheduledDate: {
          lt: endOfDay(yesterday)
        }
      }
    });

    // Reschedule unclaimed services to today at 7am
    const today = new Date();
    const sevenAM = setHours(startOfDay(today), 7);
    
    for (const service of unclaimedServices) {
      try {
        await prisma.service.update({
          where: { id: service.id },
          data: {
            scheduledDate: sevenAM,
            notes: service.notes 
              ? `${service.notes}\nRescheduled from ${service.scheduledDate.toISOString().split('T')[0]} (unclaimed)`
              : `Rescheduled from ${service.scheduledDate.toISOString().split('T')[0]} (unclaimed)`
          }
        });
        results.rescheduled++;
      } catch (error) {
        console.error(`Error rescheduling service ${service.id}:`, error);
        results.errors.push(`Failed to reschedule service ${service.id}`);
      }
    }

    // Step 2: Schedule new services based on customer preferences
    // Get all active customers with preferred service day
    const customers = await prisma.customer.findMany({
      where: {
        serviceDay: { not: null },
        subscription: {
          status: 'ACTIVE'
        }
      },
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      }
    });

    // Get the default service plan
    const defaultPlan = await prisma.servicePlan.findFirst({
      where: { isActive: true, type: 'REGULAR' }
    });

    if (!defaultPlan) {
      return NextResponse.json(
        { error: 'No active default service plan found', results },
        { status: 500 }
      );
    }

    // Look ahead 7 days and schedule services
    const lookAheadDays = 7;
    const lastLookAheadDate = addDays(today, lookAheadDays);

    for (const customer of customers) {
      if (!customer.serviceDay) continue;

      // Get the next service date based on preferred day
      const nextServiceDate = getNextDayOccurrence(customer.serviceDay);
      
      // Only schedule if within our look-ahead window
      if (isAfter(nextServiceDate, lastLookAheadDate) || isBefore(nextServiceDate, today)) {
        continue;
      }

      // Check if service is already scheduled
      const existingService = await prisma.service.findFirst({
        where: {
          customerId: customer.id,
          scheduledDate: {
            gte: startOfDay(nextServiceDate),
            lte: endOfDay(nextServiceDate)
          }
        }
      });

      if (!existingService) {
        try {
          // Get the service plan from the subscription or use default
          const planId = customer.subscription?.planId || defaultPlan.id;
          
          // Create the service
          await prisma.service.create({
            data: {
              customerId: customer.id,
              status: 'SCHEDULED',
              scheduledDate: nextServiceDate,
              servicePlanId: planId,
              notes: `Automatically scheduled for ${customer.serviceDay}`
            }
          });
          results.scheduled++;
        } catch (error) {
          console.error(`Error scheduling service for customer ${customer.id}:`, error);
          results.errors.push(`Failed to schedule service for customer ${customer.id}`);
        }
      }
    }

    return NextResponse.json({
      message: `Rescheduled ${results.rescheduled} unclaimed services, scheduled ${results.scheduled} new services`,
      results
    });
  } catch (error) {
    console.error('Error in schedule-services cron job:', error);
    return NextResponse.json(
      { error: 'Failed to process schedule-services job' },
      { status: 500 }
    );
  }
} 