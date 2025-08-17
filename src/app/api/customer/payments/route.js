import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { validateUser } from '@/lib/api-auth';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getCache, setCache, generateCacheKey, invalidateCache } from '@/lib/cache';
import { rateLimit } from '@/lib/rate-limit';
import { withErrorHandler, ApiError, ErrorCode } from '@/lib/error-handler';
// Specify the runtime for this route
export const runtime = 'nodejs';
// Helper function to get token and validate
async function getTokenAndValidate(request, role = 'CUSTOMER') {
    var _a, _b, _c;
    // Try header first
    let token = (_a = request.headers.get('authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    // If no token in header, try cookies
    if (!token) {
        const cookieStore = await cookies();
        token = ((_b = cookieStore.get('accessToken')) === null || _b === void 0 ? void 0 : _b.value) || ((_c = cookieStore.get('accessToken_client')) === null || _c === void 0 ? void 0 : _c.value);
    }
    // Still no token
    if (!token) {
        console.log('No token found in request headers or cookies');
        throw new ApiError('Unauthorized', ErrorCode.UNAUTHORIZED);
    }
    // Validate the token
    try {
        const decoded = await validateUser(token);
        if (!decoded || decoded.role !== role) {
            throw new ApiError('Invalid role', ErrorCode.UNAUTHORIZED);
        }
        
        // Fetch customer data
        const customer = await prisma.customer.findFirst({
            where: { userId: decoded.userId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        
        if (!customer) {
            throw new ApiError('Customer record not found', ErrorCode.NOT_FOUND);
        }
        
        return {
            userId: decoded.userId,
            customerId: customer.id,
            customer: customer
        };
    }
    catch (error) {
        console.error('Token validation error:', error);
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError('Invalid or expired token', ErrorCode.UNAUTHORIZED);
    }
}
// GET handler with error handling wrapper
export const GET = withErrorHandler(async (request) => {
    // Only apply rate limiting in production
    if (process.env.NODE_ENV === 'production') {
        const rateLimitResult = await rateLimit.limit(request);
        if (rateLimitResult) {
            return rateLimitResult;
        }
    }
    else {
        console.log('Rate limiting disabled for payments endpoint in development mode');
    }
    // Get and validate token
    const { userId, customerId, customer } = await getTokenAndValidate(request, 'CUSTOMER');
    console.log('Token validated, userId:', userId, 'customerId:', customerId);
    if (!customer) {
        throw new ApiError('Customer record not found', ErrorCode.NOT_FOUND);
    }
    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    // Use cache if available
    const cacheKey = generateCacheKey(`customer_payments_${customer.id}_${limit}`);
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
        console.log(`Using cached payments for customer: ${customer.id}`);
        return NextResponse.json(cachedData);
    }
    // Fetch the payments with retry logic
    console.log('Fetching payments for customer:', customerId);
    const payments = await prisma.payment.findMany({
        where: {
            customerId: customerId,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: limit,
    });
    console.log(`Found ${payments.length} payments`);
    // Cache the results for future requests
    await setCache(cacheKey, payments, 60); // Cache for 60 seconds
    return NextResponse.json(payments);
});
// Input validation schema
const createPaymentSchema = z.object({
    amount: z.number().positive(),
    serviceId: z.string().min(1),
    paymentMethodId: z.string().min(1),
});
// POST handler with error handling wrapper
export const POST = withErrorHandler(async (request) => {
    // Get and validate token
    const { userId, customerId, customer } = await getTokenAndValidate(request, 'CUSTOMER');
    
    if (!customer) {
        throw new ApiError('Customer not found', ErrorCode.NOT_FOUND);
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
        throw new ApiError('Service not found', ErrorCode.NOT_FOUND);
    }
    
            // Create payment with transaction retry
        const payment = await prisma.payment.create({
            data: {
                customerId: customer.id,
                serviceId: validatedData.serviceId,
                amount: validatedData.amount,
                status: 'PENDING',
                paymentMethod: validatedData.paymentMethodId
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
});
