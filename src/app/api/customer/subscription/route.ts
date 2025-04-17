import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer's subscription details
    const subscription = await sql`
      SELECT 
        s.*,
        p.name as plan_name,
        p.price as plan_price,
        p.frequency as plan_frequency
      FROM subscriptions s
      JOIN plans p ON p.id = s.plan_id
      WHERE s.customer_id = (
        SELECT id FROM customers WHERE user_id = ${decoded.userId}
      )
      ORDER BY s.created_at DESC
      LIMIT 1
    `;

    if (!subscription.length) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    const sub = subscription[0];
    return NextResponse.json({
      id: sub.id,
      status: sub.status,
      startDate: sub.start_date,
      nextBillingDate: sub.next_billing_date,
      plan: {
        name: sub.plan_name,
        price: sub.plan_price,
        frequency: sub.plan_frequency,
      },
      stripeSubscriptionId: sub.stripe_subscription_id,
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
} 