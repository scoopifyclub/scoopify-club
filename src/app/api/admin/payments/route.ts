import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payments = await prisma.payment.findMany({
      include: {
        employee: {
          select: {
            name: true,
          },
        },
        service: {
          select: {
            id: true,
            scheduledDate: true,
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the frontend interface
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      employeeId: payment.employeeId,
      employeeName: payment.employee.name,
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      paidAt: payment.paidAt,
      serviceDate: payment.service?.scheduledDate,
      customerName: payment.service?.customer.name,
    }));

    return NextResponse.json(formattedPayments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { employeeId, amount, paymentMethod } = await request.json();

    const payment = await prisma.payment.create({
      data: {
        employeeId,
        amount,
        paymentMethod,
        paymentDate: new Date(),
        status: 'PENDING',
      },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 