import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Verify authorization
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (payload.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the customer record
    const customer = await prisma.customer.findUnique({
      where: { userId: payload.userId }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get referrals made by this customer
    const referrals = await prisma.referral.findMany({
      where: { referrerId: customer.id },
      include: {
        referred: {
          include: {
            user: true,
            subscription: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response
    const formattedReferrals = referrals.map(referral => ({
      id: referral.id,
      referredName: referral.referred.user.name,
      referredEmail: referral.referred.user.email,
      status: referral.status,
      dateReferred: referral.createdAt,
      isActive: referral.status === 'ACTIVE' && 
                referral.referred.subscription?.status === 'ACTIVE'
    }));

    return NextResponse.json({ referrals: formattedReferrals });
  } catch (error) {
    console.error('Error getting referrals:', error);
    return NextResponse.json(
      { error: 'Failed to get referrals' },
      { status: 500 }
    );
  }
} 