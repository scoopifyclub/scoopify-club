import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

// Manual per-earning transfers were replaced by the weekly automated payout
// (/api/cron/process-employee-payouts), which keeps one ledgered transfer per
// scooper per week. A second transfer path outside that ledger could pay a
// job twice, so this endpoint no longer moves money.
export async function POST(req) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  return NextResponse.json(
    {
      error: 'Manual payouts are retired. Scooper pay is sent automatically every Friday; run /api/cron/process-employee-payouts to pay now, and use /api/admin/payouts/holds for refunds and disputes.',
    },
    { status: 410 }
  );
}
