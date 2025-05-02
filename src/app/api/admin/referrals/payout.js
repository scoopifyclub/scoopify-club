import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/api-auth';

// POST: Process referral payouts (Stripe) - Only allowed on Fridays unless override=true
export async function POST(req) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { override } = await req.json();
    const now = new Date();
    const isFriday = now.getUTCDay() === 5; // 5 = Friday
    if (!isFriday && !override) {
      return NextResponse.json({
        warning: true,
        message: 'Referral payouts are only allowed on Fridays. Override to proceed.'
      }, { status: 400 });
    }

    // TODO: Implement actual batch payout logic here
    // Example: Find all approved, unpaid Stripe referrals and mark as paid
    const referrals = await prisma.referral.findMany({
      where: { status: 'APPROVED', paymentMethod: 'STRIPE' },
    });
    // ... payout logic ...
    // For now, just return count
    return NextResponse.json({ success: true, paidCount: referrals.length });
  } catch (error) {
    console.error('Error processing referral payouts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
