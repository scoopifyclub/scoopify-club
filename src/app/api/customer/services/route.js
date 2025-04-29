import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
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
        throw new Error('Unauthorized');
    }
    // Validate the token
    try {
        return await validateUser(token, role);
    }
    catch (error) {
        console.error('Token validation error:', error);
        throw error;
    }
}
export async function GET(request) {
    try {
        // Only apply rate limiting in production
        if (process.env.NODE_ENV === 'production') {
            const rateLimitResult = await rateLimit.limit(request);
            if (rateLimitResult) {
                return rateLimitResult;
            }
        }
        else {
            console.log('Rate limiting disabled for services endpoint in development mode');
        }
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
        // Build the query
        const query = {
            where: Object.assign({ customerId: customer.id }, (status && { status: status.toUpperCase() })),
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
        return NextResponse.json(services);
    }
    catch (error) {
        console.error('Error fetching services:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
const createServiceSchema = z.object({
    scheduledDate: z.string().datetime(),
    servicePlanId: z.string().min(1),
    notes: z.string().optional(),
    locationId: z.string().min(1),
});
export async function POST(request) {
    var _a;
    try {
        // Apply rate limiting
        const rateLimitResult = await rateLimit(request);
        if (rateLimitResult) {
            return rateLimitResult;
        }
        const cookieStore = await cookies();
        const accessToken = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
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
        return NextResponse.json(service, { status: 201 });
    }
    catch (error) {
        console.error('Create service error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create service' }, { status: 500 });
    }
}
