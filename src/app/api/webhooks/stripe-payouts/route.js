import { NextResponse } from 'next/server';
import { getStripe, syncConnectAccount } from '@/lib/stripe-connect';
import { handleChargeRefunded, handleDispute } from '@/lib/payout-holds';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Scooper-payout webhooks, kept apart from /api/webhooks/stripe (customer
// billing). Two Stripe endpoints point here, each with its own signing secret:
//  - a Connect endpoint ("events on connected accounts"): account.updated
//    -> STRIPE_CONNECT_WEBHOOK_SECRET
//  - a platform endpoint: charge.refunded, charge.dispute.created,
//    charge.dispute.updated, charge.dispute.closed
//    -> STRIPE_PAYOUTS_WEBHOOK_SECRET
// Every handler is idempotent, so Stripe retries and duplicate deliveries are safe.

function verify(stripe, body, signature) {
  const secrets = [process.env.STRIPE_CONNECT_WEBHOOK_SECRET, process.env.STRIPE_PAYOUTS_WEBHOOK_SECRET].filter(Boolean);
  if (!secrets.length) throw new Error('No payouts webhook secret is configured');
  let lastError;
  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(body, signature, secret);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export async function POST(request) {
  const stripe = getStripe();
  const body = await request.text();
  let event;
  try {
    event = verify(stripe, body, request.headers.get('stripe-signature'));
  } catch (error) {
    console.error('[PAYOUTS WEBHOOK] signature verification failed:', error.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    let result = { ignored: true };
    switch (event.type) {
      case 'account.updated':
        result = await syncConnectAccount(event.data.object);
        break;
      case 'charge.refunded':
        result = await handleChargeRefunded(event.data.object);
        break;
      case 'charge.dispute.created':
      case 'charge.dispute.updated':
      case 'charge.dispute.closed':
        result = await handleDispute(event.data.object, { stripe });
        break;
      default:
        break;
    }
    return NextResponse.json({ received: true, type: event.type, result });
  } catch (error) {
    console.error(`[PAYOUTS WEBHOOK] ${event.type} ${event.id} failed:`, error);
    // 500 makes Stripe retry the delivery.
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
