import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { validateUser } from '@/lib/api-auth';
import { cookies } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
    var _a;
    try {
        // Only apply rate limiting in production
        if (process.env.NODE_ENV === 'production') {
            const rateLimitResult = await rateLimit.limit(request);
            if (rateLimitResult) {
                return rateLimitResult;
            }
        }
        else {
            console.log('Rate limiting disabled for subscription endpoint in development mode');
        }
        const cookieStore = await cookies();
        const token = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { userId } = await validateUser(token, 'CUSTOMER');
        
        // Get customer details including subscription
        const customer = await prisma.customer.findFirst({
            where: { userId: userId },
            include: {
                subscription: {
                    include: {
                        servicePlan: true
                    }
                }
            }
        });
        
        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        
        // Return customer data with subscription info
        return NextResponse.json({
            customer: {
                id: customer.id,
                serviceCredits: customer.serviceCredits,
                serviceDay: customer.serviceDay
            },
            subscription: customer.subscription ? {
                id: customer.subscription.id,
                status: customer.subscription.status,
                startDate: customer.subscription.startDate,
                endDate: customer.subscription.endDate,
                plan: customer.subscription.servicePlan ? {
                    name: customer.subscription.servicePlan.name,
                    price: customer.subscription.servicePlan.price,
                    duration: customer.subscription.servicePlan.duration
                } : null
            } : null
        });
    }
    catch (error) {
        console.error('Subscription error:', error);
        return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        // Only apply rate limiting in production
        if (process.env.NODE_ENV === 'production') {
            const rateLimitResult = await rateLimit.limit(request);
            if (rateLimitResult) {
                return rateLimitResult;
            }
        }
        
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const { userId } = await validateUser(token, 'CUSTOMER');
        const { planId, preferredDay } = await request.json();
        
        if (!planId || !preferredDay) {
            return NextResponse.json({ error: 'Plan ID and preferred day are required' }, { status: 400 });
        }
        
        // Get customer
        const customer = await prisma.customer.findFirst({
            where: { userId: userId }
        });
        
        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        
        // Check if customer already has an active subscription
        const existingSubscription = await prisma.subscription.findFirst({
            where: {
                customerId: customer.id,
                status: 'ACTIVE'
            }
        });
        
        if (existingSubscription) {
            return NextResponse.json({ error: 'Customer already has an active subscription' }, { status: 400 });
        }
        
        // Create subscription
        const subscription = await prisma.subscription.create({
            data: {
                id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                customerId: customer.id,
                planId: planId,
                startDate: new Date(),
                status: 'ACTIVE'
            }
        });
        
        // Update customer with service day and initial credits
        await prisma.customer.update({
            where: { id: customer.id },
            data: {
                serviceDay: preferredDay,
                serviceCredits: 5, // 1 credit for initial cleanup + 4 credits for monthly services
                subscriptionId: subscription.id
            }
        });

        // Create an initial cleanup service automatically
        const initialCleanupPlan = await prisma.servicePlan.findFirst({
            where: { type: 'INITIAL_CLEANUP' }
        });

        if (initialCleanupPlan) {
            await prisma.service.create({
                data: {
                    id: `init_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    customerId: customer.id,
                    scheduledDate: new Date(),
                    servicePlanId: initialCleanupPlan.id,
                    status: 'SCHEDULED',
                    workflowStatus: 'PENDING',
                    notes: 'Initial cleanup service - yard preparation for weekly maintenance',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
        }
        
        return NextResponse.json({
            success: true,
            subscription: subscription,
            message: 'Subscription created successfully'
        });
        
    } catch (error) {
        console.error('Subscription creation error:', error);
        return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }
}
