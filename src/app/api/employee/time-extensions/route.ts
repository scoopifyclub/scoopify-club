import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return new NextResponse('Employee ID is required', { status: 400 });
    }

    // Get the last 5 records (mix of time extensions and cancellations)
    const timeExtensions = await prisma.timeExtension.findMany({
      where: {
        employeeId
      },
      include: {
        service: {
          include: {
            subscription: {
              include: {
                customer: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    const cancellations = await prisma.service.findMany({
      where: {
        employeeId,
        status: 'CANCELLED',
        cancellationReason: {
          not: null
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
        updatedAt: 'desc'
      },
      take: 5
    });

    // Format the response
    const formattedExtensions = timeExtensions.map(extension => ({
      type: 'extension',
      id: extension.id,
      serviceId: extension.serviceId,
      customerName: extension.service.subscription.customer.name,
      minutes: extension.minutes,
      reason: extension.reason,
      createdAt: extension.createdAt
    }));

    const formattedCancellations = cancellations.map(cancellation => ({
      type: 'cancellation',
      id: cancellation.id,
      serviceId: cancellation.id,
      customerName: cancellation.subscription.customer.name,
      reason: cancellation.cancellationReason,
      createdAt: cancellation.updatedAt
    }));

    // Combine and sort by date
    const combinedHistory = [...formattedExtensions, ...formattedCancellations]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return NextResponse.json(combinedHistory);
  } catch (error) {
    console.error('Error fetching history:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 