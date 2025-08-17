import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

// This endpoint should be called by a cron job every day at 8:00 AM
// It opens the job pool and rolls over unclaimed jobs from previous days
export async function POST(request) {
  try {
    console.log('🚀 Opening job pool and rolling over unclaimed jobs...');
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Step 1: Find all unclaimed services from yesterday
    const unclaimedServices = await prisma.service.findMany({
      where: {
        status: 'SCHEDULED',
        employeeId: null, // Not claimed by any scooper
        scheduledDate: {
          gte: new Date(yesterday.setHours(0, 0, 0, 0)),
          lt: new Date(yesterday.setHours(23, 59, 59, 999))
        }
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
    
    console.log(`Found ${unclaimedServices.length} unclaimed services from yesterday`);
    
    // Step 2: Roll over unclaimed services to today
    const rolledOverServices = [];
    
    for (const service of unclaimedServices) {
      try {
        // Roll over to today at the same time
        const newScheduledDate = new Date(today);
        newScheduledDate.setHours(service.scheduledDate.getHours(), service.scheduledDate.getMinutes(), 0, 0);
        
        // Create a new service for today
        const rolledOverService = await prisma.service.create({
          data: {
            customerId: service.customerId,
            servicePlanId: service.servicePlanId,
            scheduledDate: newScheduledDate,
            status: 'SCHEDULED',
            potentialEarnings: service.potentialEarnings,
            subscriptionId: service.subscriptionId,
            notes: `Rolled over from ${service.scheduledDate.toLocaleDateString()} (unclaimed)`,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        // Mark the old service as expired
        await prisma.service.update({
          where: { id: service.id },
          data: {
            status: 'EXPIRED',
            notes: `Expired - rolled over to ${newScheduledDate.toLocaleDateString()}`,
            updatedAt: new Date()
          }
        });
        
        rolledOverServices.push(rolledOverService);
        
        console.log(`Rolled over service ${service.id} to ${newScheduledDate.toLocaleDateString()}`);
        
      } catch (error) {
        console.error(`Failed to roll over service ${service.id}:`, error);
      }
    }
    
    // Step 3: Send notifications to customers about rolled over services
    for (const service of rolledOverServices) {
      try {
        await prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: service.customer.userId,
            type: 'service-rolled-over',
            title: 'Service Rescheduled',
            message: `Your service from yesterday has been automatically rescheduled for today since no scooper was available.`,
            metadata: {
              serviceId: service.id,
              originalDate: yesterday.toLocaleDateString(),
              newDate: today.toLocaleDateString()
            },
            createdAt: new Date()
          }
        });
      } catch (error) {
        console.warn(`Failed to create notification for service ${service.id}:`, error);
      }
    }
    
    console.log(`✅ Successfully rolled over ${rolledOverServices.length} services`);
    
    return NextResponse.json({
      success: true,
      message: `Job pool opened successfully. Rolled over ${rolledOverServices.length} unclaimed services.`,
      rolledOverServices: rolledOverServices.length,
      totalUnclaimed: unclaimedServices.length
    });
    
  } catch (error) {
    console.error('❌ Error opening job pool:', error);
    return NextResponse.json(
      { error: 'Failed to open job pool' },
      { status: 500 }
    );
  }
}
