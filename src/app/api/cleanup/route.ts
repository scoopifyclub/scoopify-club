import { NextResponse } from 'next/server';
import { stripe, createOneTimeCharge } from '@/lib/stripe';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, description, serviceDate } = await request.json();

    if (!amount || !description || !serviceDate) {
      return NextResponse.json(
        { error: 'Amount, description, and service date are required' },
        { status: 400 }
      );
    }

    // Get customer's Stripe ID
    const customer = await prisma.customer.findFirst({
      where: { userId: decoded.userId },
      select: { 
        id: true,
        stripeCustomerId: true,
        isActive: true,
      },
    });

    if (!customer?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Create one-time charge
    const paymentIntent = await createOneTimeCharge(
      customer.stripeCustomerId,
      amount,
      description
    );

    // Create service record for one-time cleanup
    const service = await prisma.service.create({
      data: {
        customerId: customer.id,
        scheduledFor: new Date(serviceDate),
        status: 'SCHEDULED',
        type: 'ONE_TIME',
        amount,
        description,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      service,
    });
  } catch (error) {
    console.error('Cleanup charge error:', error);
    return NextResponse.json(
      { error: 'Failed to create cleanup charge' },
      { status: 500 }
    );
  }
} 