import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { generateReferralCode } from '@/lib/utils';

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
      where: { userId: payload.userId },
      select: {
        id: true,
        referralCode: true
      }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // If customer doesn't have a referral code yet, generate and save one
    if (!customer.referralCode) {
      const referralCode = generateReferralCode();
      
      const updatedCustomer = await prisma.customer.update({
        where: { id: customer.id },
        data: { referralCode },
        select: {
          id: true,
          referralCode: true
        }
      });
      
      return NextResponse.json({ referralCode: updatedCustomer.referralCode });
    }

    return NextResponse.json({ referralCode: customer.referralCode });
  } catch (error) {
    console.error('Error getting referral code:', error);
    return NextResponse.json(
      { error: 'Failed to get referral code' },
      { status: 500 }
    );
  }
} 