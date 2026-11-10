import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireScooper, claimService, jobClaimErrorResponse } from '@/lib/job-claims';

export const runtime = 'nodejs';

export async function POST(request, { params }) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const auth = await requireScooper(request);
    if (!auth.ok) return auth.response;
    const employee = auth.employee;

    const job = await claimService({ serviceId: jobId, employeeId: employee.id });

    // Create a notification for the customer
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: job.customerId },
        select: { userId: true }
      });
      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId: customer.userId,
          type: 'service-claimed',
          title: 'Service Claimed',
          message: 'Your service has been claimed. A scooper will arrive soon.',
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
      job
    });

  } catch (error) {
    return jobClaimErrorResponse(error, 'Failed to claim job');
  }
}
