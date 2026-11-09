import { NextResponse } from 'next/server';
import { requireScooper } from '@/lib/job-claims';
import { employeePayoutSummary } from '@/lib/scooper-payouts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The signed-in scooper's earnings, holds, payouts and Stripe Connect status. */
export async function GET(request) {
  const auth = await requireScooper(request, { requireApproval: false });
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json(await employeePayoutSummary(auth.employee));
  } catch (error) {
    console.error('Error loading scooper payouts:', error);
    return NextResponse.json({ error: 'Failed to load earnings' }, { status: 500 });
  }
}
