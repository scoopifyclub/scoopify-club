import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { financialOpsSnapshot } from '@/lib/admin-financials';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/financials?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Ops snapshot for the admin financial dashboard: per-range job economics
 * (revenue, scooper share, Stripe fees, Scoopify keep), current owed balances,
 * open holds, and recent payouts.
 */
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const params = new URL(request.url).searchParams;
  try {
    const snapshot = await financialOpsSnapshot({
      from: params.get('from') || undefined,
      to: params.get('to') || undefined,
    });
    return NextResponse.json(snapshot, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error.status === 400) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error building financial ops snapshot:', error);
    return NextResponse.json({ error: 'Failed to load financial snapshot' }, { status: 500 });
  }
}
