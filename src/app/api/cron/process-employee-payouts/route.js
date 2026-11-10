import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCronOrAdmin } from '@/lib/cron-auth';
import { runPayouts } from '@/lib/scooper-payouts';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Friday scooper payouts (vercel.json). Applies refund/dispute holds and pays
// each scooper one Stripe Connect transfer for the unpaid JobFinancialRecords
// of jobs completed before this week (America/Denver). With PAYOUTS_ENABLED
// unset it moves no money and reports what it would pay.
// Safe to re-run: see runPayouts.
async function handle(request) {
  const auth = await requireCronOrAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const result = await runPayouts();
    const { summary, period, mode } = result;
    const message = mode === 'transfer'
      ? `Payouts ${period.start}..${period.end}: $${summary.paid.toFixed(2)} sent in ${summary.transfers} transfer(s), $${summary.failed.toFixed(2)} failed, $${summary.needsOnboarding.toFixed(2)} waiting on Stripe onboarding.`
      : `Payout report ${period.start}..${period.end}: $${summary.wouldPay.toFixed(2)} would be paid, $${summary.needsOnboarding.toFixed(2)} waiting on Stripe onboarding. Nothing was transferred${result.blockedReason ? ` (${result.blockedReason})` : ' (PAYOUTS_ENABLED is not true)'}.`;

    try {
      await prisma.systemLog.create({
        data: { type: mode === 'transfer' ? 'PAYOUT_RUN' : 'PAYOUT_REPORT', message, data: JSON.parse(JSON.stringify(result)) },
      });
    } catch (error) {
      console.error('Failed to record payout run:', error);
    }
    console.log(message);

    return NextResponse.json({ success: summary.failed === 0, payoutsEnabled: mode === 'transfer', message, ...result });
  } catch (error) {
    console.error('Error running employee payouts:', error);
    return NextResponse.json({ error: 'Failed to run employee payouts' }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
