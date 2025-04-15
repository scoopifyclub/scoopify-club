import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { paymentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { paymentId } = params;

    // Cancel all scheduled retries for this payment
    await prisma.paymentRetry.updateMany({
      where: {
        paymentId,
        status: 'SCHEDULED'
      },
      data: {
        status: 'CANCELLED'
      }
    });

    // Update customer status to DO_NOT_SERVICE
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        subscription: {
          include: {
            customer: true
          }
        }
      }
    });

    if (payment) {
      await prisma.customer.update({
        where: { id: payment.subscription.customerId },
        data: {
          status: 'DO_NOT_SERVICE'
        }
      });

      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: 'CANCELLED',
          endDate: new Date()
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling payment retry:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 