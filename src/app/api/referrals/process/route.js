import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/api-auth';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    // Only admins can process referrals manually
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    // Process all pending referrals
    const pendingReferrals = await prisma.referral.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        referrer: true
      }
    });

    const results = await Promise.all(pendingReferrals.map(async (referral) => {
      try {
        // Mark as processed and set payout amount to $5
        const updated = await prisma.referral.update({
          where: { id: referral.id },
          data: {
            status: 'PROCESSED',
            payoutAmount: 5.00, // $5 fixed monthly referral fee
            payoutStatus: 'PENDING',
            payoutDate: new Date()
          }
        });

        return updated;
      } catch (error) {
        console.error(`Error processing referral ${referral.id}:`, error);
        return { id: referral.id, error: error.message };
      }
    }));

    const successful = results.filter(r => !r.error);
    const failed = results.filter(r => r.error);

    return NextResponse.json({
      processed: successful.length,
      failed: failed.length,
      referrals: successful,
      errors: failed
    });

  } catch (error) {
    console.error('Error processing referrals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
