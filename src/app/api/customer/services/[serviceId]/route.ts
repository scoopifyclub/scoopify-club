import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { serviceId: string } }
) {
  try {
    // Verify customer authorization
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the service with all related data
    const service = await prisma.service.findUnique({
      where: { id: params.serviceId },
      include: {
        customer: {
          select: {
            userId: true
          }
        },
        employee: {
          select: {
            name: true,
            phone: true
          }
        },
        address: true,
        checklist: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        photos: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        feedback: {
          select: {
            rating: true,
            comment: true,
            createdAt: true
          }
        }
      }
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Verify ownership
    if (service.customer.userId !== decoded.id) {
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
  { params }: { params: { serviceId: string } }
) {
  try {
    // Verify customer authorization
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rating, comment } = await request.json();

    // Validate feedback data
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid rating. Must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Get the service and verify ownership
    const service = await prisma.service.findUnique({
      where: { id: params.serviceId },
      include: {
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

    if (service.customer.userId !== decoded.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create or update feedback
    const feedback = await prisma.serviceFeedback.upsert({
      where: {
        serviceId: params.serviceId
      },
      create: {
        serviceId: params.serviceId,
        rating,
        comment: comment || '',
      },
      update: {
        rating,
        comment: comment || '',
      }
    });

    return NextResponse.json({
      feedback,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
} 