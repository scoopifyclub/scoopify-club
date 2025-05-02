import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/api-auth';

export async function GET(request) {
  const { userId } = getUserFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { userId },
      include: { serviceAreas: true }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Get available jobs that match employee's service areas
    const availableJobs = await prisma.jobPool.findMany({
      where: {
        status: 'AVAILABLE',
        service: {
          serviceArea: {
            employeeId: employee.id,
            active: true
          }
        }
      },
      include: {
        service: {
          include: {
            customer: true,
            serviceArea: true
          }
        }
      },
      orderBy: {
        openedAt: 'asc'
      }
    });

    return NextResponse.json(availableJobs);
  } catch (error) {
    console.error('Error fetching job pool:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job pool' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { userId } = getUserFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { serviceId } = await request.json();

    // Check if job exists and is available
    const job = await prisma.jobPool.findUnique({
      where: { serviceId },
      include: {
        service: {
          include: {
            customer: true,
            serviceArea: true
          }
        }
      }
    });

    if (!job || job.status !== 'AVAILABLE') {
      return NextResponse.json(
        { error: 'Job not available' },
        { status: 400 }
      );
    }

    // Check if employee is assigned to the service area
    const employee = await prisma.employee.findUnique({
      where: { userId },
      include: {
        serviceAreas: {
          where: {
            id: job.service.serviceAreaId,
            active: true
          }
        }
      }
    });

    if (!employee || !employee.serviceAreas.length) {
      return NextResponse.json(
        { error: 'Employee not authorized for this service area' },
        { status: 403 }
      );
    }

    // Claim the job
    const claimedJob = await prisma.jobPool.update({
      where: { serviceId },
      data: {
        status: 'CLAIMED',
        claimerId: employee.id,
        claimedAt: new Date()
      },
      include: {
        service: {
          include: {
            customer: true,
            serviceArea: true
          }
        }
      }
    });

    // Update service status
    await prisma.service.update({
      where: { id: serviceId },
      data: {
        status: 'IN_PROGRESS',
        employeeId: employee.id,
        claimedAt: new Date()
      }
    });

    return NextResponse.json(claimedJob);
  } catch (error) {
    console.error('Error claiming job:', error);
    return NextResponse.json(
      { error: 'Failed to claim job' },
      { status: 500 }
    );
  }
}
