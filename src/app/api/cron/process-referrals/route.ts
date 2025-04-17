import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateReferralCommission } from '@/lib/utils';
import { processCashAppPayment } from '@/lib/cashapp'; // You'll need to implement this

export async function POST(request: Request) {
  try {
    // Verify that this is called by a cron job
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active referrals that haven't been paid this month
    const referrals = await prisma.referral.findMany({
      where: {
        status: 'ACTIVE',
        referred: {
          subscription: {
            status: 'ACTIVE'
          }
        }
      },
      include: {
        referrer: {
          include: {
            user: true
          }
        },
        referred: {
          include: {
            subscription: {
              include: {
                plan: true
              }
            }
          }
        }
      }
    });

    const results = [];

    for (const referral of referrals) {
      try {
        // Check if we already paid for this month
        const existingPayment = await prisma.referralPayment.findFirst({
          where: {
            referralId: referral.id,
            payment_date: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        });

        if (existingPayment) {
          continue;
        }

        // Calculate commission based on subscription amount
        const subscriptionAmount = referral.referred.subscription?.plan.price || 0;
        const commission = calculateReferralCommission(subscriptionAmount);

        // Skip if no commission to pay
        if (commission <= 0) {
          continue;
        }

        // Skip if no Cash App tag
        if (!referral.referrer.cashAppTag) {
          results.push({
            referralId: referral.id,
            status: 'FAILED',
            error: 'No Cash App tag provided'
          });
          continue;
        }

        // Process payment via Cash App
        const paymentResult = await processCashAppPayment({
          amount: commission,
          recipient: referral.referrer.cashAppTag,
          note: `Referral reward for ${referral.referred.user.name}`
        });

        // Record the payment
        await prisma.referralPayment.create({
          data: {
            referralId: referral.id,
            amount: commission,
            status: paymentResult.status,
            cash_app_payment_id: paymentResult.id
          }
        });

        results.push({
          referralId: referral.id,
          status: 'SUCCESS',
          amount: commission
        });
      } catch (error) {
        console.error(`Error processing referral ${referral.id}:`, error);
        results.push({
          referralId: referral.id,
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      processed: results.length,
      successful: results.filter(r => r.status === 'SUCCESS').length,
      failed: results.filter(r => r.status === 'FAILED').length,
      results
    });
  } catch (error) {
    console.error('Error processing referral payments:', error);
    return NextResponse.json(
      { error: 'Failed to process referral payments' },
      { status: 500 }
    );
  }
} 