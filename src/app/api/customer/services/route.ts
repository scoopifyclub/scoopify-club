import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { getCache, setCache, generateCacheKey, invalidateCache } from '@/lib/cache';
import { isAfter } from 'date-fns';

// Initialize rate limiter only if Redis is properly configured
let ratelimit = null;

// Check if Redis URL is configured correctly
if (process.env.REDIS_URL && process.env.REDIS_TOKEN) {
  try {
    // Only initialize Upstash Redis with HTTPS URLs
    if (process.env.REDIS_URL.startsWith('https://')) {
      const redis = new Redis({
        url: process.env.REDIS_URL,
        token: process.env.REDIS_TOKEN,
      });
      
      ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
      });
    } else {
      console.log('Local Redis URL detected. Skipping Upstash Redis initialization for rate limiting.');
    }
  } catch (error) {
    console.error('Redis initialization error:', error);
  }
}

// Helper function to get token and validate
async function getTokenAndValidate(request: Request, role = 'CUSTOMER') {
  // Try header first
  let token = request.headers.get('authorization')?.split(' ')[1];
  
  // If no token in header, try cookies
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get('accessToken')?.value || cookieStore.get('accessToken_client')?.value;
  }
  
  // Still no token
  if (!token) {
    console.log('No token found in request headers or cookies');
    throw new Error('Unauthorized');
  }
  
  // Validate the token
  try {
    return await validateUser(token, role);
  } catch (error) {
    console.error('Token validation error:', error);
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    console.log('Customer services GET request received');
    
    // Get and validate token - this will include customer data
    const { userId, customerId, customer } = await getTokenAndValidate(request, 'CUSTOMER');
    console.log('Token validated, userId:', userId, 'customerId:', customerId);

    if (!customer) {
      return NextResponse.json({ error: 'Customer record not found' }, { status: 404 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    try {
      // Build the query
      const query: any = {
        where: {
          customerId: customer.id,
          ...(status && { status: status.toUpperCase() })
        },
        include: {
          employee: {
            include: {
              user: {
                select: {
                  name: true
                }
              }
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
          location: true
        },
        orderBy: {
          scheduledDate: 'desc'
        },
        take: limit
      };

      // Fetch the services
      console.log('Fetching services for customer:', customer.id);
      const services = await prisma.service.findMany(query);
      console.log(`Found ${services.length} services`);

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

        // Format the employee data with name from the user relation
        const formattedEmployee = service.employee ? {
          id: service.employee.id,
          userId: service.employee.userId,
          name: service.employee.user?.name || 'Unknown',
        } : null;

        return {
          id: service.id,
          status: service.status,
          scheduledDate: service.scheduledDate.toISOString(),
          completedAt: service.completedAt ? service.completedAt.toISOString() : null,
          location: service.location,
          employee: formattedEmployee,
          notes: service.notes,
          photos: processedPhotos
        };
      });

      console.log('Services retrieved successfully');
      return NextResponse.json(formattedServices);
    } catch (dbError) {
      console.error('Prisma error when fetching services:', dbError);
      
      // Check for specific Prisma error types
      if (dbError.code) {
        // Handle Prisma Client specific errors
        console.error('Prisma error code:', dbError.code);
        return NextResponse.json(
          { error: 'Database error', code: dbError.code, message: dbError.message },
          { status: 500 }
        );
      }
      
      throw dbError; // Re-throw to be caught by the outer try-catch
    }
  } catch (error) {
    console.error('Error fetching customer services:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Customer record not found') {
        return NextResponse.json({ error: 'Customer record not found' }, { status: 404 });
      }
      
      // Return detailed error message in development
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json(
          { 
            error: 'Failed to fetch services', 
            message: error.message,
            stack: error.stack 
          },
          { status: 500 }
        );
      }
    }
    
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
      try {
        const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
        const { success } = await ratelimit.limit(ip);
        if (!success) {
          return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }
      } catch (error) {
        // Log error but continue processing the request
        console.error('Rate limiting error in services endpoint:', error);
        // Don't return - let the request proceed without rate limiting
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