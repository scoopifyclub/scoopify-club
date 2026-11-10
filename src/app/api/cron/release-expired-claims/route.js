import { NextResponse } from 'next/server';
import { requireCronOrAdmin } from '@/lib/cron-auth';
import { releaseExpiredClaims, CLAIM_WINDOW_MINUTES } from '@/lib/job-claims';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Requeues jobs claimed more than CLAIM_WINDOW_MINUTES ago without a check-in.
// Runs every 5 minutes from Vercel Cron (Authorization: Bearer CRON_SECRET);
// a verified admin can also trigger it. Claim, check-in and the
// job feeds run the same release lazily, so a missed run only delays requeueing.
async function handle(request) {
  const auth = await requireCronOrAdmin(request);
  if (!auth.ok) return auth.response;
  try {
    const result = await releaseExpiredClaims();
    return NextResponse.json({ success: true, claimWindowMinutes: CLAIM_WINDOW_MINUTES, ...result });
  } catch (error) {
    console.error('Failed to release expired claims:', error);
    return NextResponse.json({ error: 'Failed to release expired claims' }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
