import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/api-auth';
import { cookies } from 'next/headers';
import prisma from "@/lib/prisma";
import { stripe } from '@/lib/stripe';
import { logger } from '@/lib/logger';
export async function POST(request) {
    var _a;
    try {
        // Get access token from cookies
        const cookieStore = await cookies();
        const accessToken = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Validate the token and check role
        const { userId, role } = await validateUser(accessToken);
        if (!(session === null || session === void 0 ? void 0 : session.user)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { resumeDate } = await request.json();
        // Validate resumeDate (if provided)
        if (resumeDate) {
            const resumeDateObj = new Date(resumeDate);
            if (isNaN(resumeDateObj.getTime()) || resumeDateObj < new Date()) {
                return NextResponse.json({ error: 'Invalid resume date. Must be a future date.' }, { status: 400 });
            }
        }
        // Get the customer
        const customer = await prisma.customer.findUnique({
            where: { userId: userId },
            include: { subscription: true }
        });
        if (!customer || !customer.subscription) {
            return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
        }
        // Check if subscription is already paused
        if (customer.subscription.status === 'PAUSED') {
            return NextResponse.json({ error: 'Subscription is already paused' }, { status: 400 });
        }
        // Check if subscription is eligible for pausing
        if (customer.subscription.status !== 'ACTIVE') {
            return NextResponse.json({ error: 'Only active subscriptions can be paused' }, { status: 400 });
        }
        if (!customer.stripeCustomerId || !customer.subscription.stripeSubscriptionId) {
            return NextResponse.json({ error: 'Stripe subscription not found' }, { status: 400 });
        }
        // Pause the subscription in Stripe
        // Note: This depends on Stripe's pause capability, which might require a specific configuration
        // For this example, we're implementing a "pause" by updating the subscription metadata
        // and cancellation behavior
        const pausedSubscription = await stripe.subscriptions.update(customer.subscription.stripeSubscriptionId, {
            pause_collection: {
                behavior: 'mark_uncollectible',
                resumes_at: resumeDate ? Math.floor(new Date(resumeDate).getTime() / 1000) : undefined
            },
            metadata: {
                status: 'paused',
                pausedAt: new Date().toISOString()
            }
        });
        // Update our database
        await prisma.subscription.update({
            where: { id: customer.subscription.id },
            data: {
                status: 'PAUSED',
                pauseDate: new Date(),
                resumeDate: resumeDate ? new Date(resumeDate) : null
            }
        });
        // Log the action
        logger.info(`Subscription ${customer.subscription.id} paused by user ${userId}`);
        return NextResponse.json({
            success: true,
            subscription: {
                id: customer.subscription.id,
                status: 'PAUSED',
                pauseDate: new Date(),
                resumeDate: resumeDate ? new Date(resumeDate) : null
            }
        });
    }
    catch (error) {
        logger.error('Error pausing subscription:', error);
        return NextResponse.json({ error: 'Failed to pause subscription' }, { status: 500 });
    }
}
