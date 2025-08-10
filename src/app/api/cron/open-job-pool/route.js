import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

// Only allow this endpoint to be called by the cron job
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Get current time in local timezone
    const now = new Date();
    
    // Check if it's 8 AM local time (not UTC)
    const localHour = now.getHours();
    const localMinute = now.getMinutes();
    
    if (localHour !== 8 || localMinute !== 0) {
      return NextResponse.json({ 
        message: 'Not 8 AM local time yet',
        currentTime: `${localHour}:${localMinute.toString().padStart(2, '0')}`,
        requiredTime: '8:00'
      });
    }

    // Unlock all scheduled jobs for today that are currently locked
    const unlockedServices = await prisma.service.updateMany({
      where: {
        status: 'SCHEDULED',
        isLocked: true,
        scheduledDate: {
          gte: startOfDay(now),
          lt: endOfDay(now)
        },
        employeeId: null // Only unlock unclaimed jobs
      },
      data: {
        isLocked: false,
        unlockedAt: now
      }
    });

    console.log(`🔓 Unlocked ${unlockedServices.count} jobs at 8 AM`);

    // Log the unlock event
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        category: 'JOB_UNLOCK',
        message: `Unlocked ${unlockedServices.count} jobs at 8 AM`,
        data: {
          unlockedCount: unlockedServices.count,
          unlockTime: now.toISOString()
        }
      }
    });

    return NextResponse.json({
      message: 'Jobs unlocked successfully at 8 AM',
      unlockedCount: unlockedServices.count,
      unlockTime: now.toISOString()
    });
  } catch (error) {
    console.error('Error in open-job-pool:', error);
    
    // Log the error
    await prisma.systemLog.create({
      data: {
        level: 'ERROR',
        category: 'JOB_UNLOCK',
        message: 'Failed to unlock jobs at 8 AM',
        data: {
          error: error.message,
          stack: error.stack
        }
      }
    });

    return NextResponse.json(
      { error: 'Failed to unlock jobs' },
      { status: 500 }
    );
  }
}
