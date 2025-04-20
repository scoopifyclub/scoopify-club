import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const referrals = await prisma.referral.findMany({
      include: {
        referrer: {
          include: {
            user: true,
          },
        },
        customer: {
          include: {
            user: true,
          },
        },
        reward: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const stats = {
      totalReferrals: referrals.length,
      pendingRewards: referrals
        .filter(r => r.reward?.status === 'PENDING')
        .reduce((sum, r) => sum + (r.reward?.amount || 0), 0),
      totalPaid: referrals
        .filter(r => r.reward?.status === 'PAID')
        .reduce((sum, r) => sum + (r.reward?.amount || 0), 0),
      totalAmount: referrals
        .filter(r => r.reward)
        .reduce((sum, r) => sum + (r.reward?.amount || 0), 0),
    };

    return NextResponse.json({
      referrals,
      stats,
    });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rewardId, status, cashAppTransactionId } = await req.json();

    if (!rewardId || !status) {
      return NextResponse.json(
        { error: 'Reward ID and status are required' },
        { status: 400 }
      );
    }

    const reward = await prisma.reward.update({
      where: { id: rewardId },
      data: {
        status,
        cashAppTransactionId,
        paidAt: status === 'PAID' ? new Date() : null,
      },
      include: {
        referral: {
          include: {
            referrer: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    // If marking as paid, create a notification for the referrer
    if (status === 'PAID') {
      await prisma.notification.create({
        data: {
          userId: reward.referral.referrer.user.id,
          type: 'REWARD_PAID',
          title: 'Referral Reward Paid',
          message: `Your $${reward.amount} referral reward has been paid via Cash App.`,
          data: {
            rewardId: reward.id,
            amount: reward.amount,
            cashAppTransactionId: reward.cashAppTransactionId,
          },
        },
      });
    }

    return NextResponse.json(reward);
  } catch (error) {
    console.error('Error updating reward:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 