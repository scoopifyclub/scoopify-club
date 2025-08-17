import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/api-auth';
import Stripe from 'stripe';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

    // Implement actual batch payout logic here
    // Find all approved, unpaid referrals
    const referrals = await prisma.referral.findMany({
      where: { 
        status: 'APPROVED', 
        payoutStatus: 'PENDING'
      },
      include: {
        referrer: {
          include: {
            user: true
          }
        }
      }
    });

    let paidCount = 0;
    let failedCount = 0;
    const results = [];

    for (const referral of referrals) {
      try {
        // Process each referral payment
        if (referral.referrer.stripeAccountId) {
          // Process via Stripe Connect
          const transfer = await stripe.transfers.create({
            amount: Math.round(referral.commissionAmount * 100), // in cents
            currency: 'usd',
            destination: referral.referrer.stripeAccountId,
            transfer_group: `referral-${referral.id}`,
            description: `Referral commission for ${referral.referredName || 'customer'}`,
          });

          // Update referral status
          await prisma.referral.update({
            where: { id: referral.id },
            data: {
              payoutStatus: 'PAID',
              payoutDate: new Date(),
              payoutMethod: 'STRIPE'
            }
          });

          // Create referral payout record
          await prisma.referralPayout.create({
            data: {
              referralId: referral.id,
              amount: referral.commissionAmount,
              stripeTransferId: transfer.id,
              status: 'COMPLETED',
              processedAt: new Date()
            }
          });

          paidCount++;
          results.push({
            id: referral.id,
            status: 'success',
            transferId: transfer.id,
            amount: referral.commissionAmount
          });

        } else {
          // Mark as pending manual payment
          await prisma.referral.update({
            where: { id: referral.id },
            data: {
              payoutStatus: 'PENDING_MANUAL',
              payoutMethod: 'MANUAL'
            }
          });
          
          results.push({
            id: referral.id,
            status: 'pending_manual',
            reason: 'No Stripe account connected'
          });
        }

      } catch (error) {
        console.error(`Error processing referral ${referral.id}:`, error);
        failedCount++;
        
        // Mark as failed
        await prisma.referral.update({
          where: { id: referral.id },
          data: {
            payoutStatus: 'FAILED',
            payoutMethod: 'STRIPE'
          }
        });

        results.push({
          id: referral.id,
          status: 'failed',
          error: error.message
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      paidCount,
      failedCount,
      totalProcessed: referrals.length,
      results
    });

  } catch (error) {
    console.error('Error processing referral payouts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
