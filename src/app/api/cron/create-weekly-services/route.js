import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addWeeks, startOfWeek, endOfWeek } from 'date-fns';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


// This endpoint should be called by a cron job (e.g., Vercel Cron)
// Recommended schedule: Every Monday at 6:00 AM
export async function POST(request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const nextWeek = addWeeks(today, 1);
    const weekStart = startOfWeek(nextWeek, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(nextWeek, { weekStartsOn: 1 }); // Sunday

    // Get all active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: today // Only active subscriptions
        }
      },
      include: {
        customer: {
          include: {
            user: true,
            address: true
          }
        },
        plan: true
      }
    });

    const createdServices = [];
    const errors = [];

    for (const subscription of activeSubscriptions) {
      try {
        // Check if service already exists for this week
        const existingService = await prisma.service.findFirst({
          where: {
            customerId: subscription.customerId,
            scheduledDate: {
              gte: weekStart,
              lte: weekEnd
            },
            status: {
              in: ['SCHEDULED', 'ASSIGNED', 'IN_PROGRESS']
            }
          }
        });

        if (existingService) {
          console.log(`Service already exists for customer ${subscription.customerId} in week ${weekStart.toISOString()}`);
          continue;
        }

        // Calculate potential earnings for this service
        const subscriptionAmount = subscription.plan.price;
        const stripeFee = subscriptionAmount * 0.029 + 0.30; // Stripe fee (2.9% + $0.30)
        const platformCut = subscriptionAmount * 0.25; // Our 25% platform cut
        const netAmount = subscriptionAmount - stripeFee - platformCut;
        // Each service = 1 credit = 1/4 of monthly payment
        // Scooper gets 100% of the net amount per service
        const perServiceAmount = netAmount / 4;
        const potentialEarnings = Math.round(perServiceAmount * 100) / 100; // Full net amount to employee

        // Create the service
        const service = await prisma.service.create({
          data: {
            customerId: subscription.customerId,
            servicePlanId: subscription.planId,
            scheduledDate: weekStart, // Default to Monday
            status: 'SCHEDULED',
            potentialEarnings,
            subscriptionId: subscription.id,
            notes: `Auto-generated service for subscription ${subscription.id}`
          },
          include: {
            customer: {
              include: {
                user: true,
                address: true
              }
            },
            servicePlan: true
          }
        });

        createdServices.push({
          id: service.id,
          customerName: service.customer.user.name,
          scheduledDate: service.scheduledDate,
          potentialEarnings: service.potentialEarnings
        });

        console.log(`Created service ${service.id} for customer ${service.customer.user.name}`);

      } catch (error) {
        console.error(`Error creating service for subscription ${subscription.id}:`, error);
        errors.push({
          subscriptionId: subscription.id,
          customerId: subscription.customerId,
          error: error.message
        });
      }
    }

    // Send summary email to admin
    if (createdServices.length > 0 || errors.length > 0) {
      await sendWeeklyServiceCreationReport(createdServices, errors);
    }

    return NextResponse.json({
      success: true,
      createdServices: createdServices.length,
      errors: errors.length,
      summary: {
        totalSubscriptions: activeSubscriptions.length,
        servicesCreated: createdServices.length,
        errors: errors.length
      }
    });

  } catch (error) {
    console.error('Error in weekly service creation:', error);
    return NextResponse.json(
      { error: 'Failed to create weekly services' },
      { status: 500 }
    );
  }
}

async function sendWeeklyServiceCreationReport(createdServices, errors) {
  try {
    // This would integrate with your email service
    // For now, we'll just log the report
    console.log('=== Weekly Service Creation Report ===');
    console.log(`Services Created: ${createdServices.length}`);
    console.log(`Errors: ${errors.length}`);
    
    if (createdServices.length > 0) {
      console.log('\nCreated Services:');
      createdServices.forEach(service => {
        console.log(`- ${service.customerName}: ${service.scheduledDate} ($${service.potentialEarnings})`);
      });
    }
    
    if (errors.length > 0) {
      console.log('\nErrors:');
      errors.forEach(error => {
        console.log(`- Subscription ${error.subscriptionId}: ${error.error}`);
      });
    }
  } catch (error) {
    console.error('Error sending weekly service creation report:', error);
  }
} 