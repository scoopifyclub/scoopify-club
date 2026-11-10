import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { rateLimit } from '@/lib/auth-rate-limit';
import { calculateTaxes } from '@/lib/tax-calculator';
import { getInitialCleanupLineItem, resolvePurchasablePlan } from '@/lib/pricing.server';
import { validateUserToken } from '@/lib/jwt-utils';
import prisma from '@/lib/prisma';

// Lets the webhook link the purchase to an existing Customer. Anonymous
// checkout still works; the webhook then matches on the buyer's email.
async function findSignedInCustomer(request) {
    const token = request.cookies?.get('accessToken')?.value || request.cookies?.get('token')?.value;
    if (!token) return null;
    try {
        const user = await validateUserToken(token, 'CUSTOMER');
        if (!user?.userId) return null;
        const customer = await prisma.customer.findUnique({
            where: { userId: user.userId },
            select: { id: true, stripeCustomerId: true },
        });
        if (!customer) return null;
        return { customerId: customer.id, stripeCustomerId: customer.stripeCustomerId, email: user.email };
    }
    catch (error) {
        console.error('Could not resolve signed-in customer for checkout:', error.message);
        return null;
    }
}

export async function POST(request) {
    if (typeof window !== 'undefined') {
        return NextResponse.json({ error: 'This endpoint is server-side only' }, { status: 403 });
    }

    try {
        // Rate limiting for payment requests
        const identifier = request.headers.get('x-forwarded-for') || 'unknown';
        const { success } = await rateLimit(identifier, 10, '5 m'); // 10 requests per 5 minutes
        
        if (!success) {
            return NextResponse.json({ 
                error: 'Too many payment requests',
                code: 'rate_limit_exceeded'
            }, { status: 429 });
        }

        const {
            planId, priceId: requestedPriceId, serviceType, customerType, subtotal,
            includeInitialCleanup, startDate, attemptId, cancelPath,
        } = await request.json();

        if (!planId && !requestedPriceId) {
            return NextResponse.json({
                error: 'Plan is required',
                code: 'missing_price_id'
            }, { status: 400 });
        }

        // Only catalog plans with a configured Stripe price can be bought, and
        // the catalog (not the client) decides one-time vs subscription.
        const purchasable = resolvePurchasablePlan({ planId, priceId: requestedPriceId });
        if (!purchasable) {
            return NextResponse.json({
                error: 'This plan is not available',
                code: 'invalid_price'
            }, { status: 400 });
        }
        const { item: plan, priceId } = purchasable;
        const isOneTime = plan.kind !== 'subscription';
        const buyer = await findSignedInCustomer(request);

        if (!isOneTime && buyer) {
            const liveSubscription = await prisma.subscription.findFirst({
                where: { customerId: buyer.customerId, status: { in: ['ACTIVE', 'SUSPENDED'] } },
                select: { id: true },
            });
            if (liveSubscription) {
                return NextResponse.json({
                    error: 'You already have an active subscription',
                    code: 'already_subscribed'
                }, { status: 409 });
            }
        }

        // Signup checkout: first-visit date and the initial cleanup fee are
        // only accepted for a signed-in customer.
        const firstVisitDate = buyer && /^\d{4}-\d{2}-\d{2}$/.test(startDate || '') ? startDate : '';
        const cleanupLineItem = buyer && !isOneTime && includeInitialCleanup ? getInitialCleanupLineItem() : null;
        const safeCancelPath = typeof cancelPath === 'string' && cancelPath.startsWith('/signup/payment') ? cancelPath : '/pricing';
        const idempotencyKey = typeof attemptId === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(attemptId)
            ? `checkout-${buyer?.customerId || 'anon'}-${plan.id}-${attemptId}`
            : undefined;

        // Calculate taxes if subtotal is provided
        let taxAmount = 0;
        let totalAmount = 0;
        
        if (subtotal && serviceType && customerType) {
            const taxResult = calculateTaxes(subtotal, serviceType, customerType);
            taxAmount = taxResult.totalTax;
            totalAmount = taxResult.total;
        }

        // Check if Stripe is properly configured
        if (!stripe) {
            return NextResponse.json({ 
                error: 'Stripe is not properly configured',
                code: 'stripe_not_configured'
            }, { status: 500 });
        }
        // Get the absolute URL for success and cancel URLs
        const origin = request.headers.get('origin') || 'http://localhost:3000';
        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
                ...(cleanupLineItem ? [cleanupLineItem] : []),
                // Add tax line item if taxes were calculated
                ...(taxAmount > 0 ? [{
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Sales Tax (Peyton, CO)',
                            description: 'Colorado State (2.9%) + El Paso County (1.0%)',
                        },
                        unit_amount: Math.round(taxAmount * 100), // Convert to cents
                    },
                    quantity: 1,
                }] : [])
            ],
            mode: isOneTime ? 'payment' : 'subscription',
            success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}${safeCancelPath}`,
            ...(buyer?.stripeCustomerId
                ? { customer: buyer.stripeCustomerId }
                : buyer?.email ? { customer_email: buyer.email } : {}),
            ...(buyer ? { client_reference_id: buyer.customerId } : {}),
            ...(isOneTime
                ? { payment_intent_data: { metadata: { planId: plan.id, customerId: buyer?.customerId || '', type: 'ONE_TIME_PAYMENT' } } }
                : { subscription_data: { metadata: { planId: plan.id, customerId: buyer?.customerId || '' } } }),
            metadata: {
                planId: plan.id,
                customerId: buyer?.customerId || '',
                startDate: firstVisitDate,
                isOneTime: isOneTime ? 'true' : 'false',
                subtotal: subtotal ? subtotal.toString() : '',
                taxAmount: taxAmount.toString(),
                totalAmount: totalAmount.toString(),
                serviceType: serviceType || '',
                customerType: customerType || '',
                location: 'Peyton, Colorado'
            }
        }, idempotencyKey ? { idempotencyKey } : undefined);
        return NextResponse.json({ sessionId: session.id, url: session.url });
    }
    catch (error) {
        console.error('Error creating checkout session:', error);
        
        // Categorize Stripe errors for better user experience
        if (error.type === 'StripeCardError') {
            return NextResponse.json({ 
                error: 'Payment method was declined',
                code: 'card_declined'
            }, { status: 400 });
        }
        
        if (error.type === 'StripeInvalidRequestError') {
            return NextResponse.json({ 
                error: 'Invalid payment request',
                code: 'invalid_request'
            }, { status: 400 });
        }
        
        if (error.type === 'StripeAPIError') {
            return NextResponse.json({ 
                error: 'Payment service temporarily unavailable',
                code: 'service_unavailable'
            }, { status: 503 });
        }
        
        if (error.type === 'StripeRateLimitError') {
            return NextResponse.json({ 
                error: 'Too many requests to payment service',
                code: 'rate_limit_exceeded'
            }, { status: 429 });
        }
        
        // Generic error for unknown issues
        return NextResponse.json({ 
            error: 'Payment processing error',
            code: 'processing_error'
        }, { status: 500 });
    }
}
