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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { userId }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Build where clause
    const whereClause = {
      userId: employee.userId
    };

    if (unreadOnly) {
      whereClause.read = false;
    }

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: employee.userId,
        read: false
      }
    });

    return NextResponse.json({
      notifications,
      unreadCount,
      totalCount: notifications.length
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
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
    const { notificationIds } = await request.json();

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Invalid notification IDs' },
        { status: 400 }
      );
    }

    // Mark notifications as read
    await prisma.notification.updateMany({
      where: {
        id: {
          in: notificationIds
        },
        userId
      },
      data: {
        read: true
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
} 