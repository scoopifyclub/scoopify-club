import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { rateLimit } from '@/lib/auth-rate-limit';
import { calculateTaxes } from '@/lib/tax-calculator';
import {
    getInitialCleanupLineItem,
    resolveApprovedQuoteForCheckout,
    resolveCheckoutPromotion,
    resolvePurchasablePlan,
    resolvePurchasablePlanForMarket,
} from '@/lib/pricing.server';
import { attachQuoteCheckoutSession } from '@/lib/pricing-quotes';
import { validateUserToken } from '@/lib/jwt-utils';
import prisma from '@/lib/prisma';
import { getRequestAuthToken } from '@/lib/auth-cookies';

// Lets the webhook link the purchase to an existing Customer. Anonymous
// checkout still works; the webhook then matches on the buyer's email.
async function findSignedInCustomer(request) {
    const token = await getRequestAuthToken(request);
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

async function buildPromoDiscount({ promoCode, amountCents, planCode, marketId }) {
    if (!promoCode) return { discount: null, waiveCatchUp: false, promoMeta: {} };
    const applied = await resolveCheckoutPromotion({
        promoCode,
        amountCents,
        planCode,
        marketId,
        db: prisma,
    });
    if (!applied) return { discount: null, waiveCatchUp: false, promoMeta: {} };
    if (!applied.ok) return { error: applied };
    if (applied.waiveCatchUp) {
        return {
            discount: null,
            waiveCatchUp: true,
            promoMeta: { promoCode: applied.code, promotionId: applied.promotionId, waiveCatchUp: 'true' },
        };
    }
    if (!applied.discountCents || !stripe) {
        return {
            discount: null,
            waiveCatchUp: false,
            promoMeta: { promoCode: applied.code, promotionId: applied.promotionId },
        };
    }
    // One-shot Stripe coupon so Checkout stays authoritative; catalog amounts
    // are never rewritten in code for a promo.
    const coupon = await stripe.coupons.create({
        duration: 'once',
        amount_off: applied.discountCents,
        currency: 'usd',
        name: applied.code.slice(0, 40),
        metadata: { promotionId: applied.promotionId, code: applied.code },
    });
    return {
        discount: { coupon: coupon.id },
        waiveCatchUp: false,
        promoMeta: {
            promoCode: applied.code,
            promotionId: applied.promotionId,
            discountCents: String(applied.discountCents),
        },
    };
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
            quoteId, promoCode, zipCode,
        } = await request.json();

        if (!stripe) {
            return NextResponse.json({
                error: 'Stripe is not properly configured',
                code: 'stripe_not_configured'
            }, { status: 500 });
        }

        const buyer = await findSignedInCustomer(request);
        const origin = request.headers.get('origin') || 'http://localhost:3000';

        // ---- Approved quote path (never trusts client amounts) ----
        if (quoteId) {
            const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
            const resolved = resolveApprovedQuoteForCheckout(quote);
            if (!resolved.ok) {
                return NextResponse.json({ error: resolved.error, code: resolved.code }, { status: 400 });
            }

            const isOneTime = !resolved.isSubscription;
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

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [resolved.lineItem],
                mode: isOneTime ? 'payment' : 'subscription',
                success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${origin}/quote?quoteId=${quoteId}`,
                ...(buyer?.stripeCustomerId
                    ? { customer: buyer.stripeCustomerId }
                    : buyer?.email ? { customer_email: buyer.email } : { customer_email: quote.contactEmail }),
                ...(buyer ? { client_reference_id: buyer.customerId } : {}),
                metadata: {
                    quoteId,
                    planId: resolved.planCode,
                    customerId: buyer?.customerId || quote.customerId || '',
                    isOneTime: isOneTime ? 'true' : 'false',
                    quotedAmountCents: String(resolved.amountCents),
                },
                ...(isOneTime
                    ? { payment_intent_data: { metadata: { quoteId, planId: resolved.planCode, type: 'QUOTE_PAYMENT' } } }
                    : { subscription_data: { metadata: { quoteId, planId: resolved.planCode } } }),
            });

            await attachQuoteCheckoutSession(quoteId, {
                checkoutSessionId: session.id,
                db: prisma,
            }).catch((error) => console.error('Failed to attach quote checkout session:', error));

            return NextResponse.json({ sessionId: session.id, url: session.url });
        }

        if (!planId && !requestedPriceId) {
            return NextResponse.json({
                error: 'Plan is required',
                code: 'missing_price_id'
            }, { status: 400 });
        }

        // Only catalog plans with a configured Stripe price can be bought, and
        // the catalog (not the client) decides one-time vs subscription. Optional
        // ZIP picks a market overlay Stripe Price without rewriting live subs.
        const purchasable = zipCode
            ? await resolvePurchasablePlanForMarket({ planId, priceId: requestedPriceId, zipCode }, { db: prisma })
            : resolvePurchasablePlan({ planId, priceId: requestedPriceId });
        if (!purchasable) {
            return NextResponse.json({
                error: 'This plan is not available',
                code: 'invalid_price'
            }, { status: 400 });
        }
        const { item: plan, priceId } = purchasable;
        const isOneTime = plan.kind !== 'subscription';
        const amountCents = purchasable.amountCents
            ?? Math.round(Number(plan.displayAmount) * 100);

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

        const promo = await buildPromoDiscount({
            promoCode,
            amountCents,
            planCode: plan.id,
            marketId: purchasable.market?.id || null,
        });
        if (promo.error) {
            return NextResponse.json({ error: promo.error.error, code: promo.error.code || 'invalid_promo' }, { status: 400 });
        }

        // Signup checkout: first-visit date and the initial cleanup fee are
        // only accepted for a signed-in customer.
        const firstVisitDate = buyer && /^\d{4}-\d{2}-\d{2}$/.test(startDate || '') ? startDate : '';
        const wantsCleanup = buyer && !isOneTime && includeInitialCleanup && !promo.waiveCatchUp;
        const cleanupLineItem = wantsCleanup ? getInitialCleanupLineItem() : null;
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

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
                ...(cleanupLineItem ? [cleanupLineItem] : []),
                ...(taxAmount > 0 ? [{
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Sales Tax (Peyton, CO)',
                            description: 'Colorado State (2.9%) + El Paso County (1.0%)',
                        },
                        unit_amount: Math.round(taxAmount * 100),
                    },
                    quantity: 1,
                }] : [])
            ],
            ...(promo.discount ? { discounts: [promo.discount] } : {}),
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
                location: 'Peyton, Colorado',
                marketId: purchasable.market?.id || '',
                pricingSource: purchasable.source || 'catalog',
                ...promo.promoMeta,
            }
        }, idempotencyKey ? { idempotencyKey } : undefined);
        return NextResponse.json({ sessionId: session.id, url: session.url });
    }
    catch (error) {
        console.error('Error creating checkout session:', error);

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

        return NextResponse.json({
            error: 'Payment processing error',
            code: 'processing_error'
        }, { status: 500 });
    }
}
