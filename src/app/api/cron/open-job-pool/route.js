import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { releaseExpiredClaims, requeueOverdueUnclaimed } from '@/lib/job-claims';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

// This endpoint should be called by a cron job every day at 8:00 AM
// It opens the job pool and rolls over unclaimed jobs from previous days
export async function POST(request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;
    console.log('🚀 Opening job pool and rolling over unclaimed jobs...');

    const now = new Date();

    // Step 1: Requeue claims that were abandoned without a check-in
    const { released } = await releaseExpiredClaims({ now });

    // Step 2: Move unclaimed services from previous days onto today (same row, same time of day)
    const { requeued, services: rolledOverServices } = await requeueOverdueUnclaimed({ now });
    console.log(`Rolled over ${requeued} unclaimed services, released ${released} expired claims`);

    // Step 3: Send notifications to customers about rolled over services
    for (const service of rolledOverServices) {
      try {
        await prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: service.customer.userId,
            type: 'service-rolled-over',
            title: 'Service Rescheduled',
            message: `Your service has been automatically rescheduled for today since no scooper was available.`,
            metadata: {
              serviceId: service.id,
              originalDate: service.scheduledDate,
              newDate: service.newDate
            },
            createdAt: new Date()
          }
        });
      } catch (error) {
        console.warn(`Failed to create notification for service ${service.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Job pool opened successfully. Rolled over ${requeued} unclaimed services.`,
      rolledOverServices: requeued,
      releasedExpiredClaims: released
    });

  } catch (error) {
    console.error('❌ Error opening job pool:', error);
    return NextResponse.json(
      { error: 'Failed to open job pool' },
      { status: 500 }
    );
  }
}
