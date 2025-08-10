import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/api-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


export async function GET(request) {
  const { userId } = getUserFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Return default notification settings
    // In a real app, you might store these in the database
    const defaultSettings = {
      newJobs: true,
      serviceUpdates: true,
      paymentNotifications: true,
      systemAlerts: true,
      emailNotifications: false,
      pushNotifications: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };

    return NextResponse.json(defaultSettings);

  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const { userId } = getUserFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await request.json();

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Validate settings
    const validSettings = {
      newJobs: typeof settings.newJobs === 'boolean' ? settings.newJobs : true,
      serviceUpdates: typeof settings.serviceUpdates === 'boolean' ? settings.serviceUpdates : true,
      paymentNotifications: typeof settings.paymentNotifications === 'boolean' ? settings.paymentNotifications : true,
      systemAlerts: typeof settings.systemAlerts === 'boolean' ? settings.systemAlerts : true,
      emailNotifications: typeof settings.emailNotifications === 'boolean' ? settings.emailNotifications : false,
      pushNotifications: typeof settings.pushNotifications === 'boolean' ? settings.pushNotifications : true,
      quietHours: {
        enabled: typeof settings.quietHours?.enabled === 'boolean' ? settings.quietHours.enabled : false,
        start: settings.quietHours?.start || '22:00',
        end: settings.quietHours?.end || '08:00'
      }
    };

    // In a real app, you would save these to the database
    // For now, we'll just return the validated settings
    return NextResponse.json(validSettings);

  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
} 