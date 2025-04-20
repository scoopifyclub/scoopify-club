import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PATCH(
  request: Request,
  { params }: { params: { paymentId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { status, paymentMethod } = await request.json();

    const payment = await prisma.payment.update({
      where: {
        id: params.paymentId,
      },
      data: {
        status,
        paymentMethod,
      },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 