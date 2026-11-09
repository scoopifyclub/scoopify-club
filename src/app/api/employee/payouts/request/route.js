import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Scoopers no longer request payouts: verified jobs are paid automatically
// every Friday by Stripe Connect transfer (see /api/employee/payouts).
export async function POST() {
  return NextResponse.json(
    {
      error: 'Payouts are automatic. Verified jobs are paid every Friday to the bank account you connected through Stripe; see the Earnings page.',
      code: 'PAYOUTS_AUTOMATIC',
    },
    { status: 410 }
  );
}
