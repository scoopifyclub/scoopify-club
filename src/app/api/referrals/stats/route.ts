import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: decoded.id },
      include: {
        referrals: {
          include: {
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
        },
        referrer: {
          include: {
            code: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const stats = {
      totalReferrals: customer.referrals.length,
      pendingRewards: customer.referrals
        .filter(r => r.reward?.status === 'PENDING')
        .reduce((sum, r) => sum + (r.reward?.amount || 0), 0),
      totalEarned: customer.referrals
        .filter(r => r.reward?.status === 'PAID')
        .reduce((sum, r) => sum + (r.reward?.amount || 0), 0),
      referralCode: customer.referrer?.code || '',
      shareUrl: customer.referrer?.code
        ? `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${customer.referrer.code}`
        : '',
    };

    return NextResponse.json({
      stats,
      referrals: customer.referrals,
    });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 