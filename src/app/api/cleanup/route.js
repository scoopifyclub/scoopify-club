import { NextResponse } from 'next/server';
import { createOneTimeCharge } from '@/lib/stripe';
import { verifyToken } from '@/lib/auth';
import prisma from "@/lib/prisma";

// Import directly from the stripe-subscriptions file
import { createSubscription as stripeCreateSubscription } from '@/lib/stripe-subscriptions';

export async function POST(request) {
    try {
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'CUSTOMER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const { description, serviceDate, planId, createSubscriptionFlag, subscriptionPlanId } = await request.json();
        
        if (!description || !serviceDate) {
            return NextResponse.json(
                { error: 'Description and service date are required' },
                { status: 400 }
            );
        }
        
        // Get customer's Stripe ID
        const user = await prisma.user.findUnique({
            where: {
                id: decoded.userId || ''
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        stripeCustomerId: true
                    }
                }
            }
        });
        
        const customer = user?.customer;
        
        if (!customer?.stripeCustomerId) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            );
        }
        
        // Create one-time charge
        const paymentIntent = await createOneTimeCharge(
            customer.stripeCustomerId,
            4999, // $49.99 in cents as the amount
            description
        );
        
        // Create service record for one-time cleanup
        const service = await prisma.service.create({
            data: {
                customerId: customer.id,
                scheduledDate: new Date(serviceDate),
                status: 'SCHEDULED',
                servicePlanId: planId || "default-plan-id"
            }
        });
        
        // Also create subscription if requested
        let subscription = null;
        if (createSubscriptionFlag && subscriptionPlanId) {
            try {
                console.log(`Attempting to create subscription for customer ${customer.stripeCustomerId} with plan ${subscriptionPlanId}`);
                
                const subscriptionResult = await stripeCreateSubscription(
                    customer.stripeCustomerId,
                    subscriptionPlanId
                );
                
                console.log(`Subscription created successfully: ${subscriptionResult.id}`);
                
                // Create subscription record in database
                subscription = await prisma.subscription.create({
                    data: {
                        customerId: customer.id,
                        planId: subscriptionPlanId,
                        status: 'ACTIVE',
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default to 1 year
                    }
                });
                
                // Update customer with subscription ID
                await prisma.customer.update({
                    where: { id: customer.id },
                    data: { subscriptionId: subscription.id }
                });
                
                console.log(`Database subscription record created with ID: ${subscription.id}`);
                
            } catch (subscriptionError) {
                console.error('Subscription creation error:', subscriptionError);
                // Add more detailed error logging
                if (subscriptionError.type === 'StripeCardError') {
                    console.error('Payment method issue:', subscriptionError.message);
                } else if (subscriptionError.type === 'StripeInvalidRequestError') {
                    console.error('Invalid request to Stripe:', subscriptionError.message);
                }
                // We still continue with one-time charge even if subscription fails
            }
        }
        
        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            service,
            subscription
        });
    } catch (error) {
        console.error('Cleanup charge error:', error);
        return NextResponse.json(
            { error: 'Failed to create cleanup charge' },
            { status: 500 }
        );
    }
}
