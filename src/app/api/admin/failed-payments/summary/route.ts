import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const failedPayments = await prisma.payment.findMany({
      where: {
        status: 'FAILED',
        subscription: {
          customer: {
            status: 'PAST_DUE'
          }
        }
      },
      include: {
        subscription: {
          include: {
            customer: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: 5 // Get 5 most recent failed payments
    });

    const totalAmount = failedPayments.reduce((sum, payment) => sum + payment.amount, 0);

    const recentPayments = failedPayments.map(payment => ({
      id: payment.id,
      customerName: payment.subscription.customer.name,
      amount: payment.amount,
      date: payment.date
    }));

    return NextResponse.json({
      count: failedPayments.length,
      totalAmount,
      recentPayments
    });
  } catch (error) {
    console.error('Error fetching failed payments summary:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 