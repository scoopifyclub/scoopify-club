import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { payoutReconciliation } from '@/lib/payout-reconciliation';
import { getStripe } from '@/lib/stripe-connect';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/admin/payouts/reconciliation?from=YYYY-MM-DD&to=YYYY-MM-DD[&stripe=0]
 * Revenue, Stripe fees, scooper payouts and Scoopify margin for Denver dates
 * from..to (default: the last 28 days), from Stripe balance transactions and
 * from the database ledger, with any mismatches listed under `issues`.
 */
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const params = new URL(request.url).searchParams;
  const from = params.get('from') || undefined;
  const to = params.get('to') || undefined;
  if ((from && !YMD.test(from)) || (to && !YMD.test(to))) {
    return NextResponse.json({ error: 'from and to must be YYYY-MM-DD' }, { status: 400 });
  }

  try {
    const useStripe = params.get('stripe') !== '0' && Boolean(process.env.STRIPE_SECRET_KEY);
    return NextResponse.json(await payoutReconciliation({ from, to, stripe: useStripe ? getStripe() : null }));
  } catch (error) {
    console.error('Error building payout reconciliation:', error);
    return NextResponse.json({ error: 'Failed to build reconciliation' }, { status: 500 });
  }
}
