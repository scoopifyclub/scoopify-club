import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await validateUser(token, 'CUSTOMER');

    const customer = await prisma.customer.findFirst({
      where: { userId },
      select: { id: true }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const payments = await prisma.payment.findMany({
      where: {
        customerId: customer.id
      },
      orderBy: {
        date: 'desc'
      },
      take: 10 // Get last 10 payments
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Payments error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch payments' },
      { status: 500 }
    );
  }
} 