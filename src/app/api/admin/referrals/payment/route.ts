import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
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

    const { referralId, amount, cashAppPaymentId } = await request.json();

    if (!referralId || !amount || !cashAppPaymentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create payment record and update referral status
    const payment = await prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.referralPayment.create({
        data: {
          referralId,
          amount,
          cashAppPaymentId,
          status: 'COMPLETED',
          paymentDate: new Date(),
        },
      });

      // Update referral status to PAID
      await tx.referral.update({
        where: { id: referralId },
        data: { status: 'PAID' },
      });

      return payment;
    });

    // Fetch updated referral with related data
    const updatedReferral = await prisma.referral.findUnique({
      where: { id: referralId },
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

    return NextResponse.json({ 
      payment, 
      referral: updatedReferral 
    });
  } catch (error) {
    console.error('Error processing referral payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 