import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    
    if (!code) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    // Find the referral code
    const referralCode = await prisma.referralCode.findUnique({
      where: { code },
      include: { customer: true }
    });

    if (!referralCode) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    // Track that this code was viewed
    await prisma.referralTracking.create({
      data: {
        referralCodeId: referralCode.id,
        action: 'VIEW',
        ipAddress: request.headers.get('x-forwarded-for') || '0.0.0.0',
        userAgent: request.headers.get('user-agent') || 'Unknown'
      }
    });

    return NextResponse.json({
      success: true,
      referrer: {
        name: referralCode.customer.name,
        id: referralCode.customerId
      }
    });
  } catch (error) {
    console.error('Error tracking referral:', error);
    return NextResponse.json(
      { error: 'Failed to track referral' },
      { status: 500 }
    );
  }
} 