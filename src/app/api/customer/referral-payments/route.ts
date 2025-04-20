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

    // Get referral payments for this customer
    const payments = await prisma.payment.findMany({
      where: { 
        customerId: customer.id,
        type: {
          in: ['REFERRAL', 'MONTHLY_REFERRAL']
        },
        status: 'COMPLETED'
      },
      include: {
        referred: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      date: payment.createdAt,
      referredName: payment.referred?.user?.name || 'Unknown',
      type: payment.type
    }));

    return NextResponse.json({ payments: formattedPayments });
  } catch (error) {
    console.error('Error getting referral payments:', error);
    return NextResponse.json(
      { error: 'Failed to get referral payments' },
      { status: 500 }
    );
  }
} 