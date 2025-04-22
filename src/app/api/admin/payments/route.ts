import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // Get access token from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate the token and check admin role
    const { role } = await validateUser(accessToken, 'ADMIN');
    
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for filtering
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    
    // Build query filters
    const filters: any = {};
    if (type) filters.type = type;
    if (status) filters.status = status;

    const payments = await prisma.payment.findMany({
      where: filters,
      include: {
        employee: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        service: {
          select: {
            id: true,
            scheduledDate: true,
            customer: {
              select: {
                user: {
                  select: {
                    name: true,
                  }
                }
              },
            },
          },
        },
        referredBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the frontend interface
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      employeeId: payment.employeeId,
      employeeName: payment.employee?.user?.name || 'N/A',
      customerId: payment.customerId,
      customerName: payment.customer?.user?.name || payment.service?.customer?.user?.name || 'N/A',
      referralId: payment.referredId,
      referrerName: payment.referredBy?.name || 'N/A',
      amount: payment.amount,
      stripeFee: payment.stripeFee || 0,
      netAmount: payment.netAmount || payment.amount,
      status: payment.status,
      type: payment.type,
      paymentMethod: payment.paymentMethod,
      preferredPaymentMethod: payment.employee?.preferredPaymentMethod || null,
      notes: payment.notes,
      paidAt: payment.paidAt,
      serviceId: payment.serviceId,
      serviceDate: payment.service?.scheduledDate,
      createdAt: payment.createdAt
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
  try {
    // Get access token from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate the token and check admin role
    const { role } = await validateUser(accessToken, 'ADMIN');
    
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

// Batch approve payments - useful for weekly payment processing
export async function PUT(request: Request) {
  try {
    // Get access token from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate the token and check admin role
    const { userId, role } = await validateUser(accessToken, 'ADMIN');
    
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentIds, paymentMethod } = await request.json();
    
    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: paymentIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Use transaction to ensure all updates succeed or fail together
    const results = await prisma.$transaction(async (tx) => {
      const updates = [];
      
      for (const paymentId of paymentIds) {
        const payment = await tx.payment.findUnique({
          where: { id: paymentId }
        });
        
        if (!payment || payment.status !== 'PENDING') {
          continue; // Skip invalid or non-pending payments
        }
        
        const update = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: 'APPROVED',
            paymentMethod: paymentMethod || 'CASH_APP',
            approvedAt: new Date(),
            approvedBy: userId
          }
        });
        
        updates.push(update);
        
        // If this is a service payment, update the service status
        if (payment.serviceId) {
          await tx.service.update({
            where: { id: payment.serviceId },
            data: { 
              paymentStatus: 'APPROVED',
              paymentApprovedAt: new Date(),
              paymentApprovedBy: userId
            }
          });
        }
      }
      
      return updates;
    });

    return NextResponse.json({
      message: `Successfully approved ${results.length} payments`,
      results
    });
  } catch (error) {
    console.error('Error batch approving payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 