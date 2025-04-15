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
            customer: {
              include: {
                user: true
              }
            }
          }
        },
        retries: {
          where: {
            status: 'SCHEDULED'
          },
          orderBy: {
            scheduledDate: 'asc'
          },
          take: 1
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    const formattedPayments = failedPayments.map(payment => ({
      payment: {
        id: payment.id,
        amount: payment.amount,
        date: payment.date,
        status: payment.status,
        type: payment.type
      },
      customer: {
        id: payment.subscription.customer.id,
        name: payment.subscription.customer.name,
        email: payment.subscription.customer.user.email,
        phone: payment.subscription.customer.phone
      },
      subscription: {
        id: payment.subscription.id,
        status: payment.subscription.status,
        startDate: payment.subscription.startDate,
        endDate: payment.subscription.endDate
      },
      retryAttempts: await prisma.paymentRetry.count({
        where: {
          paymentId: payment.id,
          status: {
            in: ['COMPLETED', 'FAILED']
          }
        }
      }),
      nextRetryDate: payment.retries[0]?.scheduledDate || null
    }));

    return NextResponse.json(formattedPayments);
  } catch (error) {
    console.error('Error fetching failed payments:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 