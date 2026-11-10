import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { validateUserToken } from '@/lib/jwt-utils';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { getRequestAuthToken } from '@/lib/auth-cookies';
import { perVisitEarnings } from '@/lib/recurring-services';
import { useServiceCredit } from '@/lib/service-credits';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


// Helper function to get token and validate
async function getTokenAndValidate(request, role = 'CUSTOMER') {
    const token = await getRequestAuthToken(request);

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
                            user: {
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
    yardSize: z.enum(['small', 'medium', 'large', 'xlarge']).optional(),
    dogCount: z.number().min(1).max(20).optional(),
    specialInstructions: z.string().optional(),
    gateCode: z.string().optional(),
    accessNotes: z.string().optional(),
    isRecurring: z.boolean().optional(),
    notes: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    address: z.string().optional(),
});
class NoCreditError extends Error {}

export async function POST(request) {
    try {
        // Apply rate limiting
        const rateLimitResult = await rateLimit.limit(request);
        if (rateLimitResult) {
            return rateLimitResult;
        }
        const accessToken = await getRequestAuthToken(request);
        const decoded = accessToken ? await validateUserToken(accessToken, 'CUSTOMER') : null;
        if (!decoded?.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { userId } = decoded;
        const customer = await prisma.customer.findFirst({
            where: { userId },
            select: { 
                id: true, 
                serviceCredits: true, 
                subscriptionId: true,
                serviceDay: true
            }
        });
        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        
        // Check if customer has an active subscription
        if (!customer.subscriptionId) {
            return NextResponse.json({ error: 'Active subscription required to schedule services' }, { status: 400 });
        }
        
        // Check if customer has available credits
        if (customer.serviceCredits <= 0) {
            return NextResponse.json({ error: 'No service credits available. Please check your subscription.' }, { status: 400 });
        }
        const body = await request.json();
        const validatedData = createServiceSchema.parse(body);
        const plan = await prisma.servicePlan.findUnique({
            where: { id: validatedData.servicePlanId },
            select: { price: true, type: true }
        });
        if (!plan) {
            return NextResponse.json({ error: 'Service plan not found' }, { status: 400 });
        }
        const now = new Date();
        // Create the service with enhanced data
        const serviceData = {
            potentialEarnings: perVisitEarnings(plan),
            updatedAt: now,
            customerId: customer.id,
            scheduledDate: new Date(validatedData.scheduledDate),
            servicePlanId: validatedData.servicePlanId,
            notes: validatedData.notes || validatedData.specialInstructions,
            status: 'SCHEDULED',
            workflowStatus: 'PENDING',
            // Add new fields to the service
            ...(validatedData.yardSize && { yardSize: validatedData.yardSize }),
            ...(validatedData.dogCount && { dogCount: validatedData.dogCount }),
            ...(validatedData.gateCode && { gateCode: validatedData.gateCode }),
            ...(validatedData.accessNotes && { accessNotes: validatedData.accessNotes }),
        };

        // Only create location if coordinates are provided
        if (validatedData.latitude && validatedData.longitude) {
            serviceData.location = {
                create: {
                    latitude: validatedData.latitude,
                    longitude: validatedData.longitude,
                    address: validatedData.address
                }
            };
        }

        // Create the visit and use its credit atomically; completion will not use another.
        const result = await prisma.$transaction(async (tx) => {
            const service = await tx.service.create({
                data: { id: randomUUID(), ...serviceData },
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
            
            const credit = await useServiceCredit(tx, { serviceId: service.id, customerId: customer.id, now });
            if (credit !== 'USED') {
                throw new NoCreditError();
            }
            return { ...service, creditUsedAt: now };
        }).catch((error) => {
            if (error instanceof NoCreditError) return null;
            throw error;
        });
        if (!result) {
            return NextResponse.json({ error: 'No service credits available. Please check your subscription.' }, { status: 400 });
        }
        
        const service = result;

        // If this is a recurring service, create additional scheduled services
        if (validatedData.isRecurring) {
            // For now, just create one additional service 1 week later; its
            // credit is used when it is completed.
            // In a full implementation, this would create a subscription
            const nextWeek = new Date(validatedData.scheduledDate);
            nextWeek.setDate(nextWeek.getDate() + 7);
            
            await prisma.service.create({
                data: {
                    ...serviceData,
                    id: randomUUID(),
                    scheduledDate: nextWeek,
                    notes: `${serviceData.notes || ''} (Recurring service)`.trim()
                }
            });
        }
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
