import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // Verify admin authorization
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all active subscriptions with their customer details
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        customer: {
          include: {
            address: true,
            preferences: true,
          },
        },
      },
    });

    const createdJobs = [];
    const currentDate = new Date();

    // For each subscription, create a service job for the next week
    for (const subscription of subscriptions) {
      if (!subscription.customer.serviceDay) continue;

      // Calculate the next service date based on the customer's preferred day
      const nextServiceDate = new Date(currentDate);
      const daysUntilNextService = (subscription.customer.serviceDay.charCodeAt(0) - currentDate.getDay() + 7) % 7;
      nextServiceDate.setDate(currentDate.getDate() + daysUntilNextService + 7); // Add 7 days to get next week

      // Create the service job
      const job = await prisma.service.create({
        data: {
          customerId: subscription.customer.id,
          type: 'WEEKLY',
          status: 'PENDING',
          scheduledFor: nextServiceDate,
          amount: subscription.plan.price,
          description: 'Weekly lawn maintenance service',
          preferences: subscription.customer.preferences ? {
            create: {
              grassHeight: subscription.customer.preferences.grassHeight,
              specialInstructions: subscription.customer.preferences.specialInstructions,
              serviceAreas: subscription.customer.preferences.serviceAreas,
              addOns: subscription.customer.preferences.addOns,
            },
          } : undefined,
        },
      });

      createdJobs.push(job);
    }

    return NextResponse.json({
      message: `Successfully created ${createdJobs.length} service jobs`,
      jobs: createdJobs,
    });
  } catch (error) {
    console.error('Error scheduling jobs:', error);
    return NextResponse.json(
      { error: 'Failed to schedule jobs' },
      { status: 500 }
    );
  }
} 