import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
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
      include: { user: true },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Generate a unique referral code
    const referralCode = nanoid(8).toUpperCase();

    // Create or update the referral record
    const referral = await prisma.referral.upsert({
      where: { customerId: customer.id },
      create: {
        customerId: customer.id,
        code: referralCode,
        status: 'ACTIVE',
      },
      update: {
        code: referralCode,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      code: referral.code,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${referral.code}`,
    });
  } catch (error) {
    console.error('Error generating referral code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 