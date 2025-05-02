import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/api-auth';
import { cookies } from 'next/headers';
import prisma from "@/lib/prisma";
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});
export async function POST(req) {
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
        const { planId, paymentMethodId } = await req.json();
        if (!planId || !paymentMethodId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        // Get the user's customer record
        const customer = await prisma.customer.findUnique({
            where: { userId: userId },
            include: { subscription: true }
        });
        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        // Create or update customer in Stripe
        let stripeCustomerId = session.user.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: session.user.email,
                name: session.user.name || undefined,
                payment_method: paymentMethodId,
                invoice_settings: {
                    default_payment_method: paymentMethodId
                }
            });
            stripeCustomerId = customer.id;
            // First find the user's customer record
            const userCustomer = await prisma.customer.findUnique({
                where: { userId: session.user.id }
            });
            if (userCustomer) {
                // Update the customer record with the Stripe customer ID
                await prisma.customer.update({
                    where: { id: userCustomer.id },
                    data: { stripeCustomerId }
                });
            }
            else {
                // If no customer record exists, create one
                await prisma.customer.create({
                    data: {
                        userId: session.user.id,
                        stripeCustomerId
                    }
                });
            }
        }
        // Create subscription in Stripe
        const subscription = await stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [{ price: planId }],
            payment_behavior: 'default_incomplete',
            payment_settings: {
                payment_method_types: ['card'],
                save_default_payment_method: 'on_subscription',
            },
            expand: ['latest_invoice.payment_intent'],
        });
        // Create subscription in our database
        const dbSubscription = await prisma.subscription.create({
            data: {
                customerId: customer.id,
                status: 'PENDING',
                planId,
                nextBilling: new Date(subscription.current_period_end * 1000)
            }
        });
        return NextResponse.json({
            subscriptionId: dbSubscription.id,
            clientSecret: subscription.latest_invoice.payment_intent.client_secret
        });
    }
    catch (error) {
        console.error('Subscription creation error:', error);
        return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }
}
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!(session === null || session === void 0 ? void 0 : session.user)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const customer = await prisma.customer.findUnique({
            where: { userId: userId },
            include: {
                subscription: true,
                payments: {
                    orderBy: { date: 'desc' },
                    take: 10
                }
            }
        });
        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        return NextResponse.json({
            subscription: customer.subscription,
            payments: customer.payments
        });
    }
    catch (error) {
        console.error('Subscription fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }
}
export async function DELETE(req) {
    var _a;
    try {
        const session = await getServerSession(authOptions);
        if (!(session === null || session === void 0 ? void 0 : session.user)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const customer = await prisma.customer.findUnique({
            where: { userId: userId },
            include: { subscription: true }
        });
        if (!((_a = customer === null || customer === void 0 ? void 0 : customer.subscription) === null || _a === void 0 ? void 0 : _a.stripeSubscriptionId)) {
            return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
        }
        // Cancel subscription in Stripe
        await stripe.subscriptions.cancel(customer.subscription.stripeSubscriptionId);
        // Update subscription status in our database
        await prisma.subscription.update({
            where: { id: customer.subscription.id },
            data: { status: 'CANCELLED' }
        });
        return NextResponse.json({ success: true });
    }
    catch (error) {
        console.error('Subscription cancellation error:', error);
        return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }
}
