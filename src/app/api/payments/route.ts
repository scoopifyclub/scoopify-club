import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

const VALID_PAYMENT_METHODS = ['CASH', 'CASH_APP', 'CHECK'] as const;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { employeeId, amount, paymentMethod, serviceId } = body;

    // Validate required fields
    if (!employeeId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: employeeId, amount, and paymentMethod are required' },
        { status: 400 }
      );
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Validate payment method
    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method. Must be one of: CASH, CASH_APP, CHECK' },
        { status: 400 }
      );
    }

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Verify service exists if provided
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      if (!service) {
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 404 }
        );
      }
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        employeeId,
        amount,
        paymentMethod,
        status: 'PENDING',
        serviceId,
      },
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
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    
    // Handle specific database errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Duplicate payment record' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 