import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/api-auth';
import { stripe } from '@/lib/stripe';
import { addDays, isBefore, startOfDay } from 'date-fns';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

/**
 * B4: ServiceStatus has no PAUSED value, and pause/resume used to write
 * nonexistent Service fields + servicePause/serviceResume models (500s).
 * Billing pause/resume goes through Stripe Customer Portal instead.
 */
async function redirectBillingToPortal(customer, action) {
  if (!customer.stripeCustomerId) {
    return NextResponse.json(
      {
        error: 'No Stripe customer found. Please set up a payment method first.',
        usePortal: true,
      },
      { status: 400 }
    );
  }

  if (!stripe) {
    return NextResponse.json(
      {
        error: 'Billing portal is temporarily unavailable',
        usePortal: true,
      },
      { status: 503 }
    );
  }

  const returnBase =
    process.env.NEXT_PUBLIC_APP_URL || 'https://www.scoopify.club';
  const session = await stripe.billingPortal.sessions.create({
    customer: customer.stripeCustomerId,
    return_url: `${returnBase}/customer/dashboard?tab=billing`,
  });

  return NextResponse.json({
    success: true,
    usePortal: true,
    action,
    url: session.url,
    message:
      action === 'pause'
        ? 'Pause or manage your subscription in the Stripe Customer Portal.'
        : 'Resume or manage your subscription in the Stripe Customer Portal.',
  });
}

export async function PUT(request, { params }) {
  const auth = await getUserFromToken(request);
  const userId = auth?.userId;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, newDate, reason } = await request.json();
    const { id: serviceId } = await params;

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { userId },
      select: { id: true, stripeCustomerId: true },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get service and verify ownership
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        customerId: customer.id,
      },
      include: {
        employee: true,
        servicePlan: true,
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Pause/resume are subscription billing actions — do not touch Service.status
    // (schema has no PAUSED). Hand off to Stripe Customer Portal.
    if (action === 'pause' || action === 'resume') {
      return await redirectBillingToPortal(customer, action);
    }

    // Check if service can be modified
    if (!canModifyService(service)) {
      return NextResponse.json(
        {
          error: 'Service cannot be modified at this time',
        },
        { status: 400 }
      );
    }

    switch (action) {
      case 'cancel':
        return await cancelService(service, reason);

      case 'reschedule':
        if (!newDate) {
          return NextResponse.json(
            {
              error: 'New date is required for rescheduling',
            },
            { status: 400 }
          );
        }
        return await rescheduleService(service, newDate, reason);

      default:
        return NextResponse.json(
          {
            error: 'Invalid action',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error managing service:', error);
    return NextResponse.json(
      { error: 'Failed to manage service' },
      { status: 500 }
    );
  }
}

function canModifyService(service) {
  const now = new Date();
  const serviceDate = new Date(service.scheduledDate);

  // Can't modify if service is already completed or cancelled
  if (['COMPLETED', 'CANCELLED'].includes(service.status)) {
    return false;
  }

  // Can't modify if service is in progress
  if (service.status === 'IN_PROGRESS') {
    return false;
  }

  // Can't modify if service is less than 24 hours away
  const hoursUntilService =
    (serviceDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntilService < 24) {
    return false;
  }

  return true;
}

async function cancelService(service, reason) {
  try {
    // Update service status
    const updatedService = await prisma.service.update({
      where: { id: service.id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
        cancelledAt: new Date(),
      },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        employee: true,
      },
    });

    // If service was assigned to an employee, notify them
    if (service.employee) {
      await notifyEmployeeOfCancellation(service.employee, service);
    }

    // Create cancellation record
    await prisma.serviceCancellation.create({
      data: {
        serviceId: service.id,
        customerId: service.customerId,
        reason: reason || 'Customer requested cancellation',
        cancelledAt: new Date(),
      },
    });

    // Send cancellation confirmation to customer
    await sendCancellationConfirmation(updatedService);

    return NextResponse.json({
      success: true,
      message: 'Service cancelled successfully',
      service: updatedService,
    });
  } catch (error) {
    console.error('Error cancelling service:', error);
    throw error;
  }
}

async function rescheduleService(service, newDate, reason) {
  try {
    const requestedDate = new Date(newDate);
    const now = new Date();

    // Validate new date
    if (isBefore(requestedDate, startOfDay(now))) {
      return NextResponse.json(
        {
          error: 'Cannot reschedule to a past date',
        },
        { status: 400 }
      );
    }

    // Check if new date is available (no conflicts)
    const conflictingService = await prisma.service.findFirst({
      where: {
        customerId: service.customerId,
        scheduledDate: {
          gte: startOfDay(requestedDate),
          lt: addDays(startOfDay(requestedDate), 1),
        },
        status: {
          in: ['SCHEDULED', 'PENDING'],
        },
        id: {
          not: service.id,
        },
      },
    });

    if (conflictingService) {
      return NextResponse.json(
        {
          error: 'You already have a service scheduled on this date',
        },
        { status: 400 }
      );
    }

    // Update service
    const updatedService = await prisma.service.update({
      where: { id: service.id },
      data: {
        scheduledDate: requestedDate,
        rescheduleReason: reason,
        rescheduledAt: new Date(),
      },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        employee: true,
      },
    });

    // If service was assigned to an employee, notify them
    if (service.employee) {
      await notifyEmployeeOfReschedule(service.employee, service, requestedDate);
    }

    // Create reschedule record
    await prisma.serviceReschedule.create({
      data: {
        serviceId: service.id,
        customerId: service.customerId,
        originalDate: service.scheduledDate,
        newDate: requestedDate,
        reason: reason || 'Customer requested reschedule',
        rescheduledAt: new Date(),
      },
    });

    // Send reschedule confirmation to customer
    await sendRescheduleConfirmation(updatedService);

    return NextResponse.json({
      success: true,
      message: 'Service rescheduled successfully',
      service: updatedService,
    });
  } catch (error) {
    console.error('Error rescheduling service:', error);
    throw error;
  }
}

// Notification functions (would integrate with your notification system)
async function notifyEmployeeOfCancellation(employee, service) {
  try {
    // Create notification for employee
    await prisma.notification.create({
      data: {
        userId: employee.userId,
        type: 'SERVICE_CANCELLED',
        title: 'Service Cancelled',
        message: `Service for ${service.customer.user.name} has been cancelled`,
        metadata: {
          serviceId: service.id,
          customerName: service.customer.user.name,
        },
      },
    });
  } catch (error) {
    console.error('Error notifying employee of cancellation:', error);
  }
}

async function notifyEmployeeOfReschedule(employee, service, newDate) {
  try {
    await prisma.notification.create({
      data: {
        userId: employee.userId,
        type: 'SERVICE_RESCHEDULED',
        title: 'Service Rescheduled',
        message: `Service for ${service.customer.user.name} has been rescheduled to ${newDate.toLocaleDateString()}`,
        metadata: {
          serviceId: service.id,
          customerName: service.customer.user.name,
          newDate: newDate.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error notifying employee of reschedule:', error);
  }
}

async function sendCancellationConfirmation(service) {
  try {
    // This would integrate with your email service
    console.log(
      `Sending cancellation confirmation to ${service.customer.user.email}`
    );
  } catch (error) {
    console.error('Error sending cancellation confirmation:', error);
  }
}

async function sendRescheduleConfirmation(service) {
  try {
    // This would integrate with your email service
    console.log(
      `Sending reschedule confirmation to ${service.customer.user.email}`
    );
  } catch (error) {
    console.error('Error sending reschedule confirmation:', error);
  }
}
