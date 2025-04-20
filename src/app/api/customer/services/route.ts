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
    const accessToken = cookieStore.get('accessToken')?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, role } = await validateUser(accessToken);

    let customerId;
    if (role === 'ADMIN') {
      const { searchParams } = new URL(request.url);
      customerId = searchParams.get('customerId');
      if (!customerId) {
        return NextResponse.json({ error: 'Customer ID required for admin access' }, { status: 400 });
      }
    } else {
      const customer = await prisma.customer.findFirst({
        where: { userId },
        select: { id: true }
      });

      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
      customerId = customer.id;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const cacheKey = generateCacheKey('services', {
      customerId,
      page,
      limit,
      status,
      startDate,
      endDate,
    });

    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      if (Array.isArray(cachedData)) {
        return NextResponse.json(cachedData);
      } else if (cachedData.services) {
        return NextResponse.json(cachedData.services);
      } else {
        return NextResponse.json([]);
      }
    }

    const where: any = { customerId };
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

    await setCache(cacheKey, services, {
      ttl: 300,
      tags: [`customer:${customerId}`, 'services'],
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Services error:', error);
    return NextResponse.json([]);
  }
}

const createServiceSchema = z.object({
  scheduledDate: z.string().datetime(),
  servicePlanId: z.string().min(1),
  notes: z.string().optional(),
  locationId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    if (ratelimit) {
      const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      }
    }

    const cookieStore = await cookies();
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