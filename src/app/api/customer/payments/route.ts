import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { getCache, setCache, generateCacheKey, invalidateCache } from '@/lib/cache';

// Initialize rate limiter only if Redis is configured
const ratelimit = process.env.REDIS_URL && process.env.REDIS_TOKEN
  ? new Ratelimit({
      redis: new Redis({
        url: process.env.REDIS_URL,
        token: process.env.REDIS_TOKEN,
      }),
      limiter: Ratelimit.slidingWindow(10, '1 m'),
    })
  : null;

export async function GET(request: Request) {
  try {
    // Rate limiting only if configured
    if (ratelimit) {
      const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      }
    }

    const cookieStore = await cookies();
    const accessToken = await cookieStore.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, role } = await validateUser(accessToken);

    // If admin, get customerId from query params
    let customerId;
    if (role === 'ADMIN') {
      const { searchParams } = new URL(request.url);
      customerId = searchParams.get('customerId');
      if (!customerId) {
        return NextResponse.json({ error: 'Customer ID required for admin access' }, { status: 400 });
      }
    } else {
      // For regular customers, get their own customer record
      const customer = await prisma.customer.findFirst({
        where: { userId },
        select: { id: true }
      });

      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
      customerId = customer.id;
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Generate cache key
    const cacheKey = generateCacheKey('payments', {
      customerId,
      page,
      limit,
      status,
      startDate,
      endDate,
    });

    // Try to get from cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // Build where clause
    const where: any = { customerId };
    if (status) where.status = status;
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          service: {
            select: {
              id: true,
              status: true,
              scheduledDate: true,
              servicePlan: {
                select: {
                  name: true,
                  price: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.payment.count({ where })
    ]);

    const response = {
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };

    // Cache the response
    await setCache(cacheKey, response, {
      ttl: 300, // 5 minutes
      tags: [`customer:${customerId}`, 'payments'],
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Payments error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

// Input validation schema
const createPaymentSchema = z.object({
  amount: z.number().positive(),
  serviceId: z.string().min(1),
  paymentMethodId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    // Rate limiting
    if (ratelimit) {
      const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      }
    }

    const cookieStore = await cookies();
    const accessToken = await cookieStore.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await validateUser(accessToken, 'CUSTOMER');

    const customer = await prisma.customer.findFirst({
      where: { userId },
      select: { id: true }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = createPaymentSchema.parse(body);

    // Verify service exists and belongs to customer
    const service = await prisma.service.findFirst({
      where: {
        id: validatedData.serviceId,
        customerId: customer.id
      }
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        customerId: customer.id,
        serviceId: validatedData.serviceId,
        amount: validatedData.amount,
        status: 'PENDING',
        paymentMethodId: validatedData.paymentMethodId
      },
      include: {
        service: {
          select: {
            id: true,
            status: true,
            scheduledDate: true,
            servicePlan: {
              select: {
                name: true,
                price: true
              }
            }
          }
        }
      }
    });

    // Invalidate relevant caches
    await invalidateCache([`customer:${customer.id}`, 'payments']);

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Create payment error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment' },
      { status: 500 }
    );
  }
} 