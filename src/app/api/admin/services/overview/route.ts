import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import prisma from "@/lib/prisma";



export async function GET() {
  try {
    // Get access token from cookies
const cookieStore = await cookies();
const accessToken = cookieStore.get('accessToken')?.value;

if (!accessToken) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Validate the token and check role
const { userId, role } = await validateUser(accessToken);
    if (!session?.user || role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's services
    const todayServices = await prisma.service.count({
      where: {
        scheduledDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Get upcoming services (after today)
    const upcomingServices = await prisma.service.count({
      where: {
        scheduledDate: {
          gte: tomorrow,
        },
        status: 'PENDING',
      },
    });

    // Get completed services this month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const completedServices = await prisma.service.count({
      where: {
        scheduledDate: {
          gte: firstDayOfMonth,
        },
        status: 'COMPLETED',
      },
    });

    // Get pending services
    const pendingServices = await prisma.service.count({
      where: {
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      today: todayServices,
      upcoming: upcomingServices,
      completed: completedServices,
      pending: pendingServices,
    });
  } catch (error) {
    console.error('Error fetching service overview:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 