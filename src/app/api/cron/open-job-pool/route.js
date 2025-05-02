import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/api-auth';

const JobStatus = {
  AVAILABLE: 'AVAILABLE',
  CLAIMED: 'CLAIMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

const ServiceStatus = {
  PENDING: 'PENDING',
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

const JobPoolEntry = {
  id: '',
  serviceId: '',
  openedAt: new Date(),
  claimedAt: null,
  claimerId: null,
  status: JobStatus.AVAILABLE,
  createdAt: new Date(),
  updatedAt: new Date(),
  service: {}
};

// Remove unused Prisma import

// Only allow this endpoint to be called by the cron job
export const runtime = 'edge';

export async function GET() {
  try {
    // Get current time in UTC
    const now = new Date();
    
    // Only run if it's 7am UTC
    if (now.getUTCHours() !== 7 || now.getUTCMinutes() !== 0) {
      return NextResponse.json({ message: 'Not 7am UTC yet' });
    }

    // Get all pending services that should be in the job pool
    const pendingServices = await prisma.service.findMany({
      where: {
        status: ServiceStatus.PENDING,
        scheduledAt: {
          lte: now
        },
        pool: null
      },
      include: {
        serviceArea: true,
        customer: true
      }
    });

    // Create job pool entries for each pending service
    const jobPoolEntries = await Promise.all(
      pendingServices.map(async (service) => {
        const jobPool = await prisma.jobPool.create({
          data: {
            serviceId: service.id,
            status: JobStatus.AVAILABLE,
            openedAt: now,
            service: {
              connect: { id: service.id }
            }
          },
          include: {
            service: true
          }
        });
        return jobPool;
      })
    );

    return NextResponse.json({
      message: 'Job pool opened successfully',
      jobPoolEntries
    });
  } catch (error) {
    console.error('Error in open-job-pool:', error);
    return NextResponse.json(
      { error: 'Failed to open job pool' },
      { status: 500 }
    );
  }
}
