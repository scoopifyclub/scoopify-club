import { NextResponse } from 'next/server';
import { updateCashAppPaymentStatus } from '@/lib/cashapp';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});

async function handlePaymentSuccess(paymentIntent) {
    const paymentId = paymentIntent.id;
    const status = 'succeeded';
    await updateCashAppPaymentStatus(paymentId, status);
    console.log(`Payment ${paymentId} succeeded.`);
}

async function handlePaymentFailure(paymentIntent) {
    const paymentId = paymentIntent.id;
    const status = 'failed';
    await updateCashAppPaymentStatus(paymentId, status);
    console.log(`Payment ${paymentId} failed.`);
}

export async function POST(request) {
    try {
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        if (!signature) {
            return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
        }

        // Verify the webhook signature
        let event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentSuccess(event.data.object);
                break;
            case 'payment_intent.payment_failed':
                await handlePaymentFailure(event.data.object);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
