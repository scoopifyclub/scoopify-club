import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendPaymentFailedEmail, sendPaymentRetryEmail } from '@/lib/email';

export async function PATCH(
  request: Request,
  { params }: { params: { paymentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { paymentId } = params;
    const { status } = await request.json();

    if (!['SUCCEEDED', 'FAILED', 'PENDING', 'REFUNDED'].includes(status)) {
      return new NextResponse('Invalid status', { status: 400 });
    }

    // Update payment status
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status },
      include: {
        subscription: {
          include: {
            customer: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    // If payment failed, update customer status and schedule retry
    if (status === 'FAILED') {
      const retryDate = new Date();
      retryDate.setDate(retryDate.getDate() + 3); // 3 days from now

      // Update customer status
      await prisma.customer.update({
        where: { id: payment.subscription.customerId },
        data: {
          status: 'PAST_DUE',
          nextBillingDate: retryDate // Set retry date
        }
      });

      // Update subscription status
      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: 'PAST_DUE'
        }
      });

      // Send notification emails
      await sendPaymentFailedEmail(
        payment.subscription.customer.user.email,
        payment.subscription.customer.name,
        retryDate
      );

      // Schedule retry
      await prisma.paymentRetry.create({
        data: {
          paymentId: payment.id,
          scheduledDate: retryDate,
          status: 'SCHEDULED'
        }
      });
    }

    // If payment succeeded, update customer status
    if (status === 'SUCCEEDED') {
      await prisma.customer.update({
        where: { id: payment.subscription.customerId },
        data: {
          status: 'ACTIVE',
          lastBillingDate: new Date(),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
      });

      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: 'ACTIVE',
          lastPaymentDate: new Date()
        }
      });
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 