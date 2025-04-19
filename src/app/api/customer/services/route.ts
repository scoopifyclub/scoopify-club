import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    const cookieStore = cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Generate cache key
    const cacheKey = generateCacheKey('services', {
      customerId: customer.id,
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
    const where: any = { customerId: customer.id };
    if (status) where.status = status;
    if (startDate && endDate) {
      where.scheduledDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          servicePlan: {
            select: {
              name: true,
              price: true,
              duration: true
            }
          },
          employee: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  image: true
                }
              }
            }
          }
        },
        orderBy: {
          scheduledDate: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.service.count({ where })
    ]);

    const response = {
      services,
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
      tags: [`customer:${customer.id}`, 'services'],
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Services error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

// Input validation schema
const createServiceSchema = z.object({
  scheduledDate: z.string().datetime(),
  servicePlanId: z.string().min(1),
  notes: z.string().optional(),
  locationId: z.string().min(1),
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

    const cookieStore = cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
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
    const validatedData = createServiceSchema.parse(body);

    // Create service
    const service = await prisma.service.create({
      data: {
        customerId: customer.id,
        scheduledDate: new Date(validatedData.scheduledDate),
        servicePlanId: validatedData.servicePlanId,
        notes: validatedData.notes,
        locationId: validatedData.locationId,
        status: 'SCHEDULED'
      },
      include: {
        servicePlan: {
          select: {
            name: true,
            price: true,
            duration: true
          }
        }
      }
    });

    // Invalidate relevant caches
    await invalidateCache([`customer:${customer.id}`, 'services']);

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Create service error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create service' },
      { status: 500 }
    );
  }
} 