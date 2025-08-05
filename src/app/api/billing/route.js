import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { verifyToken } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
});
export async function GET(req) {
    try {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const user = await validateToken(token);
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const payments = await prisma.payment.findMany({
            where: {
                customerId: user.id
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: (page - 1) * limit,
            take: limit
        });
        const total = await prisma.payment.count({
            where: {
                customerId: user.id
            }
        });
        const subscription = await prisma.subscription.findFirst({
            where: {
                customerId: user.id,
                status: 'active'
            }
        });
        return NextResponse.json({
            payments,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            subscription
        });
    }
    catch (error) {
        console.error('[BILLING_GET]', error);
        return new NextResponse('Internal error', { status: 500 });
    }
}
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!(session === null || session === void 0 ? void 0 : session.user)) {
            return new NextResponse('Unauthorized', { status: 401 });
        }
        const body = await req.json();
        const { paymentMethodId, planId } = body;
        if (!paymentMethodId || !planId) {
            return new NextResponse('Missing required fields', { status: 400 });
        }
        // Create or update customer in Stripe
        let stripeCustomerId = session.user.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: session.user.email,
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
        // Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [{ price: planId }],
            payment_behavior: 'default_incomplete',
            expand: ['latest_invoice.payment_intent']
        });
        return NextResponse.json({ subscription });
    }
    catch (error) {
        console.error('[BILLING_POST]', error);
        return new NextResponse('Internal error', { status: 500 });
    }
}
