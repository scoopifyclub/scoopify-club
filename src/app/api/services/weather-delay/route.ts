import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'EMPLOYEE') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { serviceId, reason } = await request.json();

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        employee: true,
        customer: true,
      },
    });

    if (!service) {
      return new NextResponse('Service not found', { status: 404 });
    }

    if (service.employeeId !== session.user.employeeId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const delayedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        status: 'DELAYED',
        weatherDelay: {
          create: {
            reason,
            date: new Date(),
          },
        },
      },
    });

    // Send notification to customer
    // TODO: Implement notification system

    return NextResponse.json(delayedService);
  } catch (error) {
    console.error('Error delaying service:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 