import crypto from 'crypto';
import { findPlan, findPlanByPriceId } from '@/lib/pricing-catalog';

// Stripe -> DB persistence shared by the Stripe webhook and signup.
// Every write is keyed on a Stripe object ID (subscription, invoice or
// payment intent), so replays and out-of-order events converge on one row.

// Thrown when an event cannot be processed yet; the webhook answers 500 so
// Stripe retries it (e.g. the Customer row is not linked yet).
export class RetryableWebhookError extends Error {
    constructor(message) {
        super(message);
        this.name = 'RetryableWebhookError';
    }
}

const SUBSCRIPTION_STATUS = {
    active: 'ACTIVE',
    trialing: 'ACTIVE',
    past_due: 'SUSPENDED',
    unpaid: 'SUSPENDED',
    paused: 'INACTIVE',
    incomplete: 'INACTIVE',
    incomplete_expired: 'CANCELLED',
    canceled: 'CANCELLED',
};

export function mapSubscriptionStatus(stripeStatus) {
    return SUBSCRIPTION_STATUS[stripeStatus] || 'INACTIVE';
}

const toDate = (seconds) => (seconds ? new Date(seconds * 1000) : null);
const idOf = (value) => (typeof value === 'string' ? value : value?.id || null);

// Finds our Customer for a Stripe object and links stripeCustomerId on first
// sight. Match order: Stripe customer ID, our customer ID from metadata or
// client_reference_id, then the buyer's email.
export async function resolveCustomer(db, { stripeCustomerId, customerId, email }) {
    let customer = null;
    if (stripeCustomerId) {
        customer = await db.customer.findUnique({ where: { stripeCustomerId } });
        if (customer) return customer;
    }
    if (customerId) {
        customer = await db.customer.findUnique({ where: { id: customerId } });
    }
    if (!customer && email) {
        const user = await db.user.findUnique({
            where: { email: email.trim().toLowerCase() },
            include: { customer: true },
        });
        customer = user?.customer || null;
    }
    if (customer && stripeCustomerId && !customer.stripeCustomerId) {
        customer = await db.customer.update({
            where: { id: customer.id },
            data: { stripeCustomerId, updatedAt: new Date() },
        });
    }
    else if (customer && stripeCustomerId && customer.stripeCustomerId !== stripeCustomerId) {
        console.warn(`[billing] Customer ${customer.id} is linked to ${customer.stripeCustomerId}, event has ${stripeCustomerId}`);
    }
    return customer;
}

// Returns the ServicePlan row for a catalog plan, creating or relinking it so
// that ServicePlan.stripePriceId matches the configured Stripe price.
export async function ensureServicePlan(db, { priceId, planId, amount }) {
    const item = (planId && findPlan(planId)) || findPlanByPriceId(priceId);
    if (priceId) {
        const existing = await db.servicePlan.findUnique({ where: { stripePriceId: priceId } });
        if (existing) return existing;
    }
    if (!item) {
        throw new Error(`Stripe price ${priceId} is not in the pricing catalog; set the matching STRIPE_*_PRICE_ID`);
    }
    const now = new Date();
    const price = amount ?? item.displayAmount ?? 0;
    const byCode = await db.servicePlan.findUnique({ where: { code: item.id } });
    if (byCode) {
        return db.servicePlan.update({
            where: { id: byCode.id },
            data: { stripePriceId: priceId || byCode.stripePriceId, price, isActive: true, updatedAt: now },
        });
    }
    return db.servicePlan.create({
        data: {
            id: crypto.randomUUID(),
            code: item.id,
            name: item.name,
            description: item.description,
            price,
            duration: 30,
            type: item.kind === 'subscription' ? 'MONTHLY' : 'ONE_TIME',
            stripePriceId: priceId || null,
            isActive: true,
            updatedAt: now,
        },
    });
}

// Creates or updates the Subscription row for a Stripe subscription object.
export async function upsertSubscriptionFromStripe(db, stripeSubscription, { customerId: knownCustomerId } = {}) {
    const customer = knownCustomerId
        ? { id: knownCustomerId }
        : await resolveCustomer(db, {
            stripeCustomerId: idOf(stripeSubscription.customer),
            customerId: stripeSubscription.metadata?.customerId,
        });
    if (!customer) {
        throw new RetryableWebhookError(`No Customer for Stripe subscription ${stripeSubscription.id}`);
    }

    const price = stripeSubscription.items?.data?.[0]?.price;
    const servicePlan = await ensureServicePlan(db, {
        priceId: idOf(price),
        planId: stripeSubscription.metadata?.planId,
        amount: price?.unit_amount != null ? price.unit_amount / 100 : undefined,
    });

    const status = mapSubscriptionStatus(stripeSubscription.status);
    const now = new Date();
    const endedAt = toDate(stripeSubscription.ended_at || stripeSubscription.canceled_at);
    const data = {
        customerId: customer.id,
        planId: servicePlan.id,
        status,
        startDate: toDate(stripeSubscription.start_date || stripeSubscription.current_period_start) || now,
        endDate: status === 'CANCELLED'
            ? endedAt || now
            : stripeSubscription.cancel_at_period_end ? toDate(stripeSubscription.current_period_end) : null,
        nextBillingDate: status === 'CANCELLED' ? null : toDate(stripeSubscription.current_period_end),
        updatedAt: now,
    };
    const subscription = await db.subscription.upsert({
        where: { stripeSubscriptionId: stripeSubscription.id },
        create: { id: crypto.randomUUID(), stripeSubscriptionId: stripeSubscription.id, ...data },
        update: data,
    });
    if (status === 'CANCELLED') {
        await cancelFutureServices(db, subscription);
    }
    return subscription;
}

const CANCELLABLE_SERVICE_STATUSES = ['PENDING', 'SCHEDULED'];

// When a subscription ends, its not-yet-started visits must not be worked.
// Services have no subscription link, so visits are matched on customer +
// the subscription's plan; one-time visits use other plans and are kept.
// Skipped while the customer still has another live subscription on that plan.
export async function cancelFutureServices(db, subscription, { now = new Date() } = {}) {
    const otherLive = await db.subscription.findFirst({
        where: {
            customerId: subscription.customerId,
            planId: subscription.planId,
            status: { in: ['ACTIVE', 'SUSPENDED'] },
            id: { not: subscription.id },
        },
    });
    if (otherLive) return { count: 0 };
    return db.service.updateMany({
        where: {
            customerId: subscription.customerId,
            servicePlanId: subscription.planId,
            status: { in: CANCELLABLE_SERVICE_STATUSES },
            scheduledDate: { gt: now },
        },
        data: { status: 'CANCELLED', updatedAt: now },
    });
}

// The first visit for a paid Checkout. The unique stripeCheckoutSessionId
// keeps it to one visit per session however many events report the payment.
export async function ensureInitialService(db, { sessionId, customerId, servicePlanId, scheduledDate }) {
    const existing = await db.service.findUnique({ where: { stripeCheckoutSessionId: sessionId } });
    if (existing) return existing;
    const now = new Date();
    return db.service.create({
        data: {
            id: crypto.randomUUID(),
            customerId,
            servicePlanId,
            scheduledDate,
            status: 'SCHEDULED',
            stripeCheckoutSessionId: sessionId,
            updatedAt: now,
        },
    });
}

// A refund this soon after the charge may beat the payment's own webhook, so
// retry; older charges without a Payment row predate payment recording.
const UNRECORDED_CHARGE_RETRY_WINDOW_SECONDS = 24 * 60 * 60;

// charge.refunded: mirror the charge's cumulative refunded amount onto the
// Payment it paid for. The charge stays PAID; refunds live on refund* fields.
export async function recordChargeRefund(db, charge) {
    const stripePaymentIntentId = idOf(charge.payment_intent);
    const stripeInvoiceId = idOf(charge.invoice);
    const payment = (stripePaymentIntentId && await db.payment.findUnique({ where: { stripePaymentIntentId } }))
        || (stripeInvoiceId && await db.payment.findUnique({ where: { stripeInvoiceId } }))
        || null;
    if (!payment) {
        const ageSeconds = Date.now() / 1000 - (charge.created || 0);
        if (ageSeconds > UNRECORDED_CHARGE_RETRY_WINDOW_SECONDS) {
            // Charges from before payments were recorded have no row to update.
            console.warn(`charge.refunded: no Payment for ${charge.id} (${stripePaymentIntentId || stripeInvoiceId}); not retrying`);
            return null;
        }
        throw new RetryableWebhookError(`No Payment yet for refunded charge ${charge.id} (${stripePaymentIntentId || stripeInvoiceId})`);
    }
    const latestRefund = charge.refunds?.data?.[0];
    const now = new Date();
    return db.payment.update({
        where: { id: payment.id },
        data: {
            refundedAmount: charge.amount_refunded / 100,
            refundStatus: 'COMPLETED',
            refundedAt: toDate(latestRefund?.created) || now,
            refundTransactionId: latestRefund?.id || payment.refundTransactionId,
            refundReason: payment.refundReason || latestRefund?.reason || null,
            updatedAt: now,
        },
    });
}

// Refund statuses from the Stripe Refund object to our RefundStatus enum.
export function mapRefundStatus(stripeRefundStatus) {
    if (stripeRefundStatus === 'succeeded') return 'COMPLETED';
    if (stripeRefundStatus === 'failed' || stripeRefundStatus === 'canceled') return 'FAILED';
    return 'PENDING';
}

// One Payment row per Stripe invoice. A failed attempt followed by a
// successful retry updates the same row; a paid row is never downgraded.
export async function recordInvoicePayment(db, invoice, { paid }) {
    const customer = await resolveCustomer(db, {
        stripeCustomerId: idOf(invoice.customer),
        customerId: invoice.subscription_details?.metadata?.customerId,
        email: invoice.customer_email,
    });
    if (!customer) {
        throw new RetryableWebhookError(`No Customer for Stripe invoice ${invoice.id}`);
    }

    const stripeSubscriptionId = idOf(invoice.subscription);
    const subscription = stripeSubscriptionId
        ? await db.subscription.findUnique({ where: { stripeSubscriptionId } })
        : null;

    const existing = await db.payment.findUnique({ where: { stripeInvoiceId: invoice.id } });
    if (existing?.status === 'PAID' && !paid) {
        return existing;
    }

    const now = new Date();
    const amountCents = paid ? invoice.amount_paid : invoice.amount_due;
    const data = {
        amount: amountCents / 100,
        status: paid ? 'PAID' : 'FAILED',
        type: invoicePaymentType(invoice),
        customerId: customer.id,
        subscriptionId: subscription?.id || null,
        stripePaymentIntentId: idOf(invoice.payment_intent),
        paymentMethod: 'STRIPE',
        paidAt: paid ? toDate(invoice.status_transitions?.paid_at) || now : null,
        notes: paid ? null : `Payment failed (attempt ${invoice.attempt_count || 1})`,
        updatedAt: now,
    };
    const payment = await db.payment.upsert({
        where: { stripeInvoiceId: invoice.id },
        create: { id: crypto.randomUUID(), stripeInvoiceId: invoice.id, ...data },
        update: data,
    });

    if (paid && subscription) {
        const periodEnd = invoice.lines?.data?.[0]?.period?.end;
        await db.subscription.update({
            where: { id: subscription.id },
            data: {
                lastBillingDate: data.paidAt,
                ...(periodEnd ? { nextBillingDate: toDate(periodEnd) } : {}),
                updatedAt: now,
            },
        });
    }
    return payment;
}

function invoicePaymentType(invoice) {
    if (invoice.billing_reason === 'subscription_create') return 'SUBSCRIPTION';
    if (invoice.subscription) return 'SUBSCRIPTION_RENEWAL';
    return 'INVOICE';
}

// One Payment row per non-invoice PaymentIntent (one-time Checkout purchases,
// signup cleanup and one-time charges). Invoice payment intents are recorded
// by recordInvoicePayment instead.
export async function recordPaymentIntent(db, paymentIntent, { paid, customerId: knownCustomerId, email, type }) {
    const existing = await db.payment.findUnique({ where: { stripePaymentIntentId: paymentIntent.id } });
    if (existing?.status === 'PAID' && !paid) {
        return existing;
    }

    const customer = existing?.customerId
        ? { id: existing.customerId }
        : await resolveCustomer(db, {
            stripeCustomerId: idOf(paymentIntent.customer),
            customerId: knownCustomerId || paymentIntent.metadata?.customerId,
            email: email || paymentIntent.receipt_email,
        });
    if (!customer) {
        throw new RetryableWebhookError(`No Customer for Stripe payment intent ${paymentIntent.id}`);
    }

    const now = new Date();
    const data = {
        amount: (paid ? paymentIntent.amount_received || paymentIntent.amount : paymentIntent.amount) / 100,
        status: paid ? 'PAID' : 'FAILED',
        type: type || paymentTypeFromMetadata(paymentIntent.metadata),
        customerId: customer.id,
        paymentMethod: 'STRIPE',
        paidAt: paid ? now : null,
        notes: paid ? null : paymentIntent.last_payment_error?.message || 'Payment failed',
        updatedAt: now,
    };
    const statusUpdate = { status: data.status, paidAt: data.paidAt, notes: data.notes, updatedAt: now };
    return db.payment.upsert({
        where: { stripePaymentIntentId: paymentIntent.id },
        create: { id: crypto.randomUUID(), stripePaymentIntentId: paymentIntent.id, ...data },
        update: existing?.status === 'PAID' ? { updatedAt: now } : statusUpdate,
    });
}

// PaymentIntents created by signup and Checkout carry one of these
// metadata types. Others (e.g. admin-created charges) are recorded by the
// code that created them.
export const CUSTOMER_PAYMENT_INTENT_TYPES = ['SETUP_FEE', 'ONE_TIME', 'ONE_TIME_PAYMENT'];

function paymentTypeFromMetadata(metadata = {}) {
    if (metadata.type === 'SETUP_FEE') return 'INITIAL_CLEANUP';
    return 'ONE_TIME_PAYMENT';
}
