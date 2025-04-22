import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getCache, setCache, generateCacheKey, invalidateCache } from '@/lib/cache';
import { rateLimit } from '@/lib/rate-limit';

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
    // Only apply rate limiting in production
    if (process.env.NODE_ENV === 'production') {
      const rateLimitResult = await rateLimit.limit(request);
      if (rateLimitResult) {
        return rateLimitResult;
      }
    } else {
      console.log('Rate limiting disabled for payments endpoint in development mode');
    }

    // Get and validate token
    const { userId, customerId, customer } = await getTokenAndValidate(request, 'CUSTOMER');
    console.log('Token validated, userId:', userId, 'customerId:', customerId);

    if (!customer) {
      return NextResponse.json({ error: 'Customer record not found' }, { status: 404 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Fetch the payments
    console.log('Fetching payments for customer:', customer.id);
    const payments = await prisma.payment.findMany({
      where: {
        customerId: customer.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
    console.log(`Found ${payments.length} payments`);

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
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