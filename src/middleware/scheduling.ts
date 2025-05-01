import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function validateServiceSchedule(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const customerId = searchParams.get('customerId');
    const scheduledAt = searchParams.get('scheduledAt');
    const serviceWindow = searchParams.get('serviceWindow');
    const preferredDay = searchParams.get('preferredDay');

    if (!customerId || !scheduledAt || !serviceWindow || !preferredDay) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Parse dates
    const scheduleDate = new Date(scheduledAt);
    const now = new Date();

    // Check if scheduling is too soon
    const minLeadTime = 24 * 60 * 60 * 1000; // 24 hours
    if (scheduleDate.getTime() - now.getTime() < minLeadTime) {
      return NextResponse.json(
        { error: 'Must schedule at least 24 hours in advance' },
        { status: 400 }
      );
    }

    // Check if scheduling is too far in advance
    const maxLeadTime = 30 * 24 * 60 * 60 * 1000; // 30 days
    if (scheduleDate.getTime() - now.getTime() > maxLeadTime) {
      return NextResponse.json(
        { error: 'Cannot schedule more than 30 days in advance' },
        { status: 400 }
      );
    }

    // Check if service window is valid for preferred day
    const validWindows = {
      Monday: ['Morning', 'Afternoon'],
      Tuesday: ['Morning', 'Afternoon'],
      Wednesday: ['Morning', 'Afternoon'],
      Thursday: ['Morning', 'Afternoon'],
      Friday: ['Morning', 'Afternoon'],
      Saturday: ['Morning', 'Afternoon'],
      Sunday: ['Morning', 'Afternoon']
    };

    if (!validWindows[preferredDay as keyof typeof validWindows]?.includes(serviceWindow)) {
      return NextResponse.json(
        { error: 'Invalid service window for preferred day' },
        { status: 400 }
      );
    }

    // Check for scheduling conflicts
    const existingServices = await prisma.service.findMany({
      where: {
        customerId,
        scheduledAt: {
          gte: new Date(scheduleDate.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
          lte: new Date(scheduleDate.getTime() + 2 * 60 * 60 * 1000)  // 2 hours after
        },
        status: {
          not: 'COMPLETED'
        }
      }
    });

    if (existingServices.length > 0) {
      return NextResponse.json(
        { error: 'Scheduling conflict with existing service' },
        { status: 400 }
      );
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Error validating service schedule:', error);
    return NextResponse.json(
      { error: 'Failed to validate service schedule' },
      { status: 500 }
    );
  }
}
