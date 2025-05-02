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
        // Get the customer
        const customer = await prisma.customer.findUnique({
            where: { userId: userId },
            include: { subscription: true }
        });
        if (!customer || !customer.subscription) {
            return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
        }
        // Check if subscription is already active
        if (customer.subscription.status === 'ACTIVE') {
            return NextResponse.json({ error: 'Subscription is already active' }, { status: 400 });
        }
        // Check if subscription is eligible for resuming
        if (customer.subscription.status !== 'PAUSED') {
            return NextResponse.json({ error: 'Only paused subscriptions can be resumed' }, { status: 400 });
        }
        if (!customer.stripeCustomerId || !customer.subscription.stripeSubscriptionId) {
            return NextResponse.json({ error: 'Stripe subscription not found' }, { status: 400 });
        }
        // Resume the subscription in Stripe
        // This clears the pause_collection parameter
        const resumedSubscription = await stripe.subscriptions.update(customer.subscription.stripeSubscriptionId, {
            pause_collection: '', // This removes the pause_collection parameter
            metadata: {
                status: 'active',
                resumedAt: new Date().toISOString()
            }
        });
        // Update our database
        await prisma.subscription.update({
            where: { id: customer.subscription.id },
            data: {
                status: 'ACTIVE',
                resumeDate: new Date()
            }
        });
        // Log the action
        logger.info(`Subscription ${customer.subscription.id} resumed by user ${userId}`);
        return NextResponse.json({
            success: true,
            subscription: {
                id: customer.subscription.id,
                status: 'ACTIVE',
                resumeDate: new Date()
            }
        });
    }
    catch (error) {
        logger.error('Error resuming subscription:', error);
        return NextResponse.json({ error: 'Failed to resume subscription' }, { status: 500 });
    }
}
