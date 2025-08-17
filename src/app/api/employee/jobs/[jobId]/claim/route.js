import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromCookies } from '@/lib/api-auth';

export const runtime = 'nodejs';

export async function POST(request, { params }) {
  try {
    const user = await getAuthUserFromCookies(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Get the employee
    const employee = await prisma.employee.findUnique({
      where: { userId: user.id },
      include: {
        serviceAreas: {
          where: { active: true },
          select: { zipCode: true }
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Check if the job exists and is available
    const job = await prisma.service.findUnique({
      where: { id: jobId },
      include: {
        customer: {
          select: {
            userId: true,
            address: {
              select: { zipCode: true }
            }
          }
        }
      }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.employeeId) {
      return NextResponse.json({ error: 'Job has already been claimed' }, { status: 400 });
    }

    if (!['PENDING', 'SCHEDULED'].includes(job.status)) {
      return NextResponse.json({ error: 'Job is not available for claiming' }, { status: 400 });
    }

    // Check if the job is in the employee's service area
    const employeeZipCodes = employee.serviceAreas.map(area => area.zipCode);
    const jobZipCode = job.customer?.address?.zipCode;

    if (!jobZipCode || !employeeZipCodes.includes(jobZipCode)) {
      return NextResponse.json({ 
        error: 'Job is not in your service area' 
      }, { status: 400 });
    }

    // Claim the job
    const updatedJob = await prisma.service.update({
      where: { id: jobId },
      data: {
        employeeId: employee.id,
        status: 'IN_PROGRESS',
        claimedAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            address: {
              select: {
                street: true,
                city: true,
                state: true,
                zipCode: true
              }
            }
          }
        }
      }
    });

    // Create a notification for the customer
    try {
      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId: job.customer.userId,
          type: 'service-claimed',
          title: 'Service Claimed',
          message: `Your service has been claimed and is now in progress. A scooper will arrive soon.`,
          metadata: {
            serviceId: jobId,
            employeeId: employee.id,
            scheduledDate: job.scheduledDate
          },
          createdAt: new Date()
        }
      });
    } catch (notificationError) {
      console.warn('Failed to create customer notification:', notificationError);
      // Don't fail the job claim if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Job claimed successfully',
      job: {
        id: updatedJob.id,
        status: updatedJob.status,
        claimedAt: updatedJob.claimedAt,
        customer: updatedJob.customer
      }
    });

  } catch (error) {
    console.error('Error claiming job:', error);
    return NextResponse.json(
      { error: 'Failed to claim job' },
      { status: 500 }
    );
  }
}
