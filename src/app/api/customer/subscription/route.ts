import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: Request) {
  try {
    // Only apply rate limiting in production
    if (process.env.NODE_ENV === 'production') {
      const rateLimitResult = await rateLimit.limit(request);
      if (rateLimitResult) {
        return rateLimitResult;
      }
    } else {
      console.log('Rate limiting disabled for subscription endpoint in development mode');
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await validateUser(token, 'CUSTOMER');

    // Get customer's subscription details using Prisma
    const subscription = await prisma.subscription.findFirst({
      where: {
        customer: {
          userId: userId
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    // Get the service plan details
    const servicePlan = await prisma.servicePlan.findUnique({
      where: {
        id: subscription.planId
      },
      select: {
        name: true,
        price: true,
        duration: true
      }
    });

    if (!servicePlan) {
      return NextResponse.json({ error: 'Service plan not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: subscription.id,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      plan: {
        name: servicePlan.name,
        price: servicePlan.price,
        duration: servicePlan.duration
      }
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
} 