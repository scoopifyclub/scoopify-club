import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { getCache, setCache, generateCacheKey, invalidateCache } from '@/lib/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAfter } from 'date-fns';

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
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the customer record for the current user
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer record not found' }, { status: 404 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Build the query
    const query: any = {
      where: {
        customerId: customer.id,
        ...(status && { status: status.toUpperCase() })
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            userId: true
          }
        },
        photos: {
          select: {
            id: true,
            url: true,
            type: true,
            createdAt: true,
            expiresAt: true
          }
        },
        address: true
      },
      orderBy: {
        scheduledDate: 'desc'
      },
      take: limit
    };

    // Fetch the services
    const services = await prisma.service.findMany(query);

    // Process the services to format them for the frontend
    const formattedServices = services.map(service => {
      // Check if any photos are expired
      const processedPhotos = service.photos.map(photo => {
        // Return the photo with an additional property indicating if it's expired
        return {
          ...photo,
          isExpired: photo.expiresAt ? isAfter(new Date(), new Date(photo.expiresAt)) : false
        };
      });

      return {
        id: service.id,
        status: service.status,
        scheduledDate: service.scheduledDate.toISOString(),
        completedAt: service.completedAt ? service.completedAt.toISOString() : null,
        address: service.address,
        employee: service.employee,
        notes: service.notes,
        photos: processedPhotos
      };
    });

    return NextResponse.json(formattedServices);
  } catch (error) {
    console.error('Error fetching customer services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
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