import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { listJobFinancialRecords } from '@/lib/admin-financials';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/financials/jobs
 * Query: from, to, payoutStatus, employeeId, customerId, pricingBasis, q, limit, offset
 * Per-job JobFinancialRecord rows for the admin finops table.
 */
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const params = new URL(request.url).searchParams;
  try {
    const result = await listJobFinancialRecords({
      from: params.get('from') || undefined,
      to: params.get('to') || undefined,
      payoutStatus: params.get('payoutStatus') || undefined,
      employeeId: params.get('employeeId') || undefined,
      customerId: params.get('customerId') || undefined,
      pricingBasis: params.get('pricingBasis') || undefined,
      q: params.get('q') || undefined,
      limit: params.get('limit') || undefined,
      offset: params.get('offset') || undefined,
    });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error.status === 400) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error listing job financial records:', error);
    return NextResponse.json({ error: 'Failed to list job financial records' }, { status: 500 });
  }
}
