import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    
    if (!accessToken) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { userId, role } = await validateUser(accessToken, 'ADMIN');
    
    if (role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { status, paymentMethod } = await request.json();
    const { paymentId } = await params;

    const payment = await prisma.payment.update({
      where: {
        id: paymentId,
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