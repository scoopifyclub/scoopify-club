import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addDays, startOfWeek, endOfWeek, isSameDay, startOfDay, endOfDay, setHours } from 'date-fns';
import { sendServiceNotificationEmail } from '@/lib/email';

// Helper function to get the next service date based on service day
function getNextServiceDate(serviceDay: string, startDate: Date): Date {
  const days = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6
  };
  const targetDay = days[serviceDay as keyof typeof days];
  
  let nextDate = new Date(startDate);
  while (nextDate.getDay() !== targetDay) {
    nextDate = addDays(nextDate, 1);
  }
  
  return setHours(nextDate, 7); // Set default service time to 7 AM
}

export async function POST(request: Request) {
  try {
    // Get all active subscriptions with service day
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        customer: {
          serviceDay: { not: null }
        }
      },
      include: {
        customer: {
          include: {
            address: true,
            user: true
          }
        }
      }
    });

    // Get the default service plan for regular services
    const defaultServicePlan = await prisma.servicePlan.findFirst({
      where: {
        type: 'REGULAR',
        isActive: true
      }
    });

    if (!defaultServicePlan) {
      return NextResponse.json(
        { error: 'No active regular service plan found' },
        { status: 404 }
      );
    }

    // Get the start of next week
    const nextWeekStart = startOfWeek(addDays(new Date(), 7));
    const nextWeekEnd = endOfWeek(nextWeekStart);

    // Generate services for each subscription
    const services = [];
    const skippedSubscriptions = [];

    for (const subscription of subscriptions) {
      if (!subscription.customer.serviceDay) {
        skippedSubscriptions.push(subscription.customer.id);
        continue;
      }

      // Get the next service date for this customer
      const nextServiceDate = getNextServiceDate(
        subscription.customer.serviceDay,
        nextWeekStart
      );

      // Check if service already exists for this date
      const existingService = await prisma.service.findFirst({
        where: {
          customerId: subscription.customer.id,
          scheduledDate: {
            gte: startOfDay(nextServiceDate),
            lte: endOfDay(nextServiceDate)
          }
        }
      });

      if (!existingService) {
        services.push({
          customerId: subscription.customer.id,
          servicePlanId: defaultServicePlan.id,
          status: 'SCHEDULED',
          scheduledDate: nextServiceDate,
        });
      }
    }

    // Create services in a transaction
    let createdServices = [];
    if (services.length > 0) {
      createdServices = await prisma.$transaction(
        services.map(service => 
          prisma.service.create({
            data: service,
            include: {
              customer: {
                include: {
                  user: true,
                  address: true
                }
              },
              servicePlan: true
            }
          })
        )
      );

      // Send email notifications for newly created services
      await Promise.all(
        createdServices.map(async (service) => {
          try {
            await sendServiceNotificationEmail(
              service.customer.user.email,
              service.id,
              'scheduled',
              {
                date: service.scheduledDate.toLocaleDateString(),
                time: service.scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                address: service.customer.address?.street || 'No address provided',
                serviceName: service.servicePlan.name,
                duration: service.servicePlan.duration,
                price: service.servicePlan.price
              }
            );
          } catch (error) {
            console.error(`Failed to send email notification for service ${service.id}:`, error);
          }
        })
      );
    }

    return NextResponse.json({
      message: `Created ${services.length} services for next week`,
      createdServices: createdServices.map(service => ({
        id: service.id,
        customerName: service.customer.user.name,
        customerEmail: service.customer.user.email,
        scheduledDate: service.scheduledDate,
        servicePlan: service.servicePlan.name
      })),
      skippedSubscriptions,
      nextWeekStart: nextWeekStart.toISOString(),
      nextWeekEnd: nextWeekEnd.toISOString()
    });
  } catch (error) {
    console.error('Service scheduling error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 