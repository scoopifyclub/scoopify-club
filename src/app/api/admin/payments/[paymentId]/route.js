import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) {
      console.log('No access token found in cookies');
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }
    const decoded = await validateUserToken(token);
    console.log('Token verification result:', decoded ? 'success' : 'failed');
    if (!decoded || decoded.role !== 'ADMIN') {
      console.log('Invalid token or not admin:', decoded?.role);
      return NextResponse.json({ error: 'Unauthorized - Not admin' }, { status: 401 });
    }

    const { paymentId } = params;
    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        service: {
          include: {
            customer: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
            employee: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await requireRole('ADMIN');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId } = params;
    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data,
      include: {
        service: {
          include: {
            customer: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}
