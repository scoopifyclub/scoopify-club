import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    // Verify customer authorization
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await validateUser(token, 'CUSTOMER');
    const { serviceId } = await params;

    // Get the service with all related data
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        customer: {
          select: {
            userId: true
          }
        },
        employee: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        servicePlan: {
          select: {
            name: true,
            price: true,
            duration: true
          }
        },
        location: true,
        serviceArea: true,
        checklist: true,
        delays: true,
        timeExtensions: true,
        photos: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        payments: {
          select: {
            amount: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Verify ownership
    if (service.customer.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove sensitive data before sending response
    const { customer, ...serviceWithoutCustomer } = service;
    
    return NextResponse.json(serviceWithoutCustomer);
  } catch (error) {
    console.error('Error fetching service details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service details' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    // Verify customer authorization
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await validateUser(token, 'CUSTOMER');
    const { serviceId } = await params;
    const { rating, comment } = await request.json();

    // Validate feedback data
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid rating. Must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Verify service ownership
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        customer: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (service.customer.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create feedback
    const feedback = await prisma.serviceFeedback.create({
      data: {
        serviceId: serviceId,
        rating,
        comment
      }
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
} 