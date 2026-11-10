import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import {
    CUSTOMER_PAYMENT_INTENT_TYPES,
    RetryableWebhookError,
    ensureInitialService,
    ensureServicePlan,
    recordChargeRefund,
    recordInvoicePayment,
    recordPaymentIntent,
    resolveCustomer,
    upsertSubscriptionFromStripe,
} from '@/lib/stripe-billing';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Stripe retries any non-2xx response for up to 3 days, so every failure to
// persist must surface as a 500 rather than being logged and acknowledged.

const idOf = (value) => (typeof value === 'string' ? value : value?.id || null);

async function stripeCustomerEmail(stripeClient, stripeCustomerId) {
    if (!stripeCustomerId) return null;
    const customer = await stripeClient.customers.retrieve(stripeCustomerId);
    return customer?.deleted ? null : customer?.email || null;
}

// Event payloads can arrive out of order; always persist the latest state.
async function syncSubscription(tx, stripeClient, subscriptionOrId, customerId) {
    const subscription = await stripeClient.subscriptions.retrieve(idOf(subscriptionOrId));
    if (!customerId) {
        const customer = await resolveCustomer(tx, {
            stripeCustomerId: idOf(subscription.customer),
            customerId: subscription.metadata?.customerId,
            email: await stripeCustomerEmail(stripeClient, idOf(subscription.customer)),
        });
        customerId = customer?.id;
    }
    return upsertSubscriptionFromStripe(tx, subscription, { customerId });
}

async function handleCheckoutSession(tx, session, { stripeClient, paid }) {
    const customer = await resolveCustomer(tx, {
        stripeCustomerId: idOf(session.customer),
        customerId: session.client_reference_id || session.metadata?.customerId,
        email: session.customer_details?.email || session.customer_email,
    });
    if (!customer) {
        throw new RetryableWebhookError(`No Customer for checkout session ${session.id}`);
    }

    let servicePlanId = null;
    if (session.mode === 'subscription' && session.subscription) {
        const subscription = await syncSubscription(tx, stripeClient, session.subscription, customer.id);
        servicePlanId = subscription.planId;
    }

    // Async payment methods complete later via async_payment_succeeded.
    if (session.mode === 'payment' && session.payment_intent && (session.payment_status === 'paid' || !paid)) {
        await recordPaymentIntent(tx, {
            id: idOf(session.payment_intent),
            amount: session.amount_total,
            amount_received: paid ? session.amount_total : 0,
            customer: session.customer,
            metadata: session.metadata || {},
        }, { paid, customerId: customer.id, type: 'ONE_TIME_PAYMENT' });
    }

    // Signup checkouts carry the requested first visit date.
    const scheduledDate = session.metadata?.startDate ? new Date(session.metadata.startDate) : null;
    if (paid && session.payment_status === 'paid' && scheduledDate && !Number.isNaN(scheduledDate.getTime())) {
        if (!servicePlanId) {
            servicePlanId = (await ensureServicePlan(tx, { planId: session.metadata?.planId })).id;
        }
        await ensureInitialService(tx, { sessionId: session.id, customerId: customer.id, servicePlanId, scheduledDate });
    }
}

async function handleInvoice(tx, invoice, { stripeClient, paid }) {
    const stripeSubscriptionId = idOf(invoice.subscription);
    if (stripeSubscriptionId) {
        const existing = await tx.subscription.findUnique({ where: { stripeSubscriptionId } });
        if (!existing) {
            await syncSubscription(tx, stripeClient, stripeSubscriptionId);
        }
    }
    await recordInvoicePayment(tx, invoice, { paid });
}

async function handlePaymentIntent(tx, paymentIntent, { paid }) {
    if (paymentIntent.invoice) return; // recorded from the invoice event
    if (!CUSTOMER_PAYMENT_INTENT_TYPES.includes(paymentIntent.metadata?.type)) return;
    await recordPaymentIntent(tx, paymentIntent, { paid });
}

const EVENT_HANDLERS = {
    'checkout.session.completed': (tx, object, ctx) => handleCheckoutSession(tx, object, { ...ctx, paid: true }),
    'checkout.session.async_payment_succeeded': (tx, object, ctx) => handleCheckoutSession(tx, object, { ...ctx, paid: true }),
    'checkout.session.async_payment_failed': (tx, object, ctx) => handleCheckoutSession(tx, object, { ...ctx, paid: false }),
    'customer.subscription.created': (tx, object, ctx) => syncSubscription(tx, ctx.stripeClient, object),
    'customer.subscription.updated': (tx, object, ctx) => syncSubscription(tx, ctx.stripeClient, object),
    'customer.subscription.deleted': (tx, object, ctx) => syncSubscription(tx, ctx.stripeClient, object),
    'invoice.paid': (tx, object, ctx) => handleInvoice(tx, object, { ...ctx, paid: true }),
    'invoice.payment_succeeded': (tx, object, ctx) => handleInvoice(tx, object, { ...ctx, paid: true }),
    'invoice.payment_failed': (tx, object, ctx) => handleInvoice(tx, object, { ...ctx, paid: false }),
    'payment_intent.succeeded': (tx, object) => handlePaymentIntent(tx, object, { paid: true }),
    'payment_intent.payment_failed': (tx, object) => handlePaymentIntent(tx, object, { paid: false }),
    'charge.refunded': (tx, object) => recordChargeRefund(tx, object),
};

export async function POST(request) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !webhookSecret) {
        console.error('[WEBHOOK] STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is not set');
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    let event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    }
    catch (err) {
        console.error('[WEBHOOK] Signature verification failed:', err.message, {
            ip: request.headers.get('x-forwarded-for') || 'unknown',
        });
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const handler = EVENT_HANDLERS[event.type];
    if (!handler) {
        return NextResponse.json({ received: true, ignored: true });
    }

    const objectId = event.data?.object?.id || null;
    try {
        if (await prisma.stripeEvent.findUnique({ where: { id: event.id } })) {
            return NextResponse.json({ received: true, duplicate: true });
        }
        // The event row and all writes commit together, so a failed event is
        // not marked processed and Stripe's retry runs it again.
        await prisma.$transaction(async (tx) => {
            await tx.stripeEvent.create({ data: { id: event.id, type: event.type, objectId } });
            await handler(tx, event.data.object, { stripeClient: stripe });
        }, { maxWait: 10000, timeout: 30000 });
    }
    catch (error) {
        if (error?.code === 'P2002' && await prisma.stripeEvent.findUnique({ where: { id: event.id } })) {
            return NextResponse.json({ received: true, duplicate: true });
        }
        const level = error instanceof RetryableWebhookError ? 'warn' : 'error';
        console[level](`[WEBHOOK] ${event.type} ${event.id} (${objectId}) failed; Stripe will retry:`, error.message);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }

    console.log(`[WEBHOOK] Processed ${event.type} ${event.id} (${objectId})`);
    return NextResponse.json({ received: true });
}
