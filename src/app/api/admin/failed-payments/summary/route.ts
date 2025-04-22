import { NextResponse } from 'next/server';


import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // Get access token from cookies
const cookieStore = await cookies();
const accessToken = cookieStore.get('accessToken')?.value;

if (!accessToken) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Validate the token and check role
const { userId, role } = await validateUser(accessToken);
    if (role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const failedPayments = await prisma.payment.findMany({
      where: {
        status: 'FAILED'
      },
      include: {
        customer: true,
        subscription: true
      },
      orderBy: {
        date: 'desc'
      },
      take: 10
    });

    const totalAmount = failedPayments.reduce((sum, payment) => sum + payment.amount, 0);

    const summary = {
      count: failedPayments.length,
      totalAmount,
      recentPayments: failedPayments.map(payment => ({
        id: payment.id,
        customerName: payment.customer.name,
        amount: payment.amount,
        date: payment.date
      }))
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching failed payments summary:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 