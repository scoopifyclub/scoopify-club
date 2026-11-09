import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { requireAdmin } from '@/lib/admin-auth';
import { releaseExpiredClaims, CLAIM_WINDOW_MINUTES } from '@/lib/job-claims';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function hasCronSecret(request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get('authorization') || '';
  if (!secret || !header.toLowerCase().startsWith('bearer ')) return false;
  const given = Buffer.from(header.slice(7).trim());
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// Requeues jobs claimed more than CLAIM_WINDOW_MINUTES ago without a check-in.
// Meant to run every few minutes from a scheduler (Authorization: Bearer
// CRON_SECRET); a verified admin can also trigger it. Claim, check-in and the
// job feeds run the same release lazily, so a missed run only delays requeueing.
async function handle(request) {
  if (!hasCronSecret(request)) {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;
  }
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
