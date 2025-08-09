import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { validateUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

// Helper function to get token and validate
async function getTokenAndValidate(request, role = 'CUSTOMER') {
    // Try header first
    let token = request.headers.get('authorization')?.split(' ')[1];
    
    // If no token in header, try cookies
    if (!token) {
        const cookieStore = await cookies();
        token = cookieStore.get('accessToken')?.value || 
                cookieStore.get('token')?.value || 
                cookieStore.get('accessToken_client')?.value;
    }
    
    // Still no token
    if (!token) {
        console.log('No token found in request headers or cookies');
        throw new Error('Unauthorized');
    }
    
    // Validate the token using the unified JWT utility
    try {
        const userData = await validateUserToken(token, role);
        if (!userData) {
            throw new Error('Invalid token');
        }
        
        // Fetch customer data
        const customer = await prisma.customer.findFirst({
            where: { userId: userData.userId },
            include: {
                User: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        
        if (!customer) {
            throw new Error('Customer record not found');
        }
        
        return {
            userId: userData.userId,
            customerId: customer.id,
            customer: customer
        };
    }
    catch (error) {
        console.error('Token validation error:', error);
        throw error;
    }
}

export async function GET(request) {
    try {
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
            // Build the query - simplified to match working test
            const query = {
                where: { customerId: customerId },
                include: {
                    employee: {
                        include: {
                            User: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true
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
                    location: true,
                    servicePlan: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            duration: true
                        }
                    }
                },
                orderBy: {
                    scheduledDate: 'desc'
                }
            };

            // Add status filter if provided
            if (status) {
                query.where.status = status;
            }

            // Add limit
            query.take = limit;

            console.log('Executing query with customerId:', customerId);
            const services = await prisma.service.findMany(query);
            
            console.log(`Found ${services.length} services for customer ${customerId}`);
            
            return NextResponse.json({
                success: true,
                data: services,
                count: services.length
            });

        } catch (dbError) {
            console.error('Database error:', dbError);
            return NextResponse.json(
                { error: 'Failed to fetch services', details: dbError.message },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Error fetching services:', error);
        
        // Handle specific error types
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        
        if (error.message === 'Invalid token') {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }
        
        if (error.message === 'Customer record not found') {
            return NextResponse.json({ error: 'Customer record not found' }, { status: 404 });
        }
        
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
const createServiceSchema = z.object({
    scheduledDate: z.string().datetime(),
    servicePlanId: z.string().min(1),
    notes: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
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
        const { userId } = await validateUserToken(accessToken, 'CUSTOMER');
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
                status: 'SCHEDULED',
                location: {
                    create: {
                        latitude: validatedData.latitude,
                        longitude: validatedData.longitude,
                        address: validatedData.address
                    }
                }
            },
            include: {
                servicePlan: {
                    select: {
                        name: true,
                        price: true,
                        duration: true
                    }
                },
                location: true
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
