import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Verify admin authorization
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all referrals with related data
    const referrals = await prisma.referral.findMany({
      include: {
        referrer: {
          select: {
            id: true,
            name: true,
            email: true,
            cashAppTag: true,
          },
        },
        referred: {
          select: {
            id: true,
            name: true,
            email: true,
            subscription: {
              select: {
                status: true,
                plan: {
                  select: {
                    name: true,
                    price: true,
                  },
                },
              },
            },
          },
        },
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
          take: 1,
          select: {
            id: true,
            amount: true,
            status: true,
            paymentDate: true,
            cashAppPaymentId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ referrals });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    // Verify admin authorization
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { referralId, status } = await request.json();

    if (!referralId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update referral status
    const updatedReferral = await prisma.referral.update({
      where: { id: referralId },
      data: { status },
      include: {
        referrer: {
          select: {
            id: true,
            name: true,
            email: true,
            cashAppTag: true,
          },
        },
        referred: {
          select: {
            id: true,
            name: true,
            email: true,
            subscription: {
              select: {
                status: true,
                plan: {
                  select: {
                    name: true,
                    price: true,
                  },
                },
              },
            },
          },
        },
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
          take: 1,
          select: {
            id: true,
            amount: true,
            status: true,
            paymentDate: true,
            cashAppPaymentId: true,
          },
        },
      },
    });

    return NextResponse.json({ referral: updatedReferral });
  } catch (error) {
    console.error('Error updating referral:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 