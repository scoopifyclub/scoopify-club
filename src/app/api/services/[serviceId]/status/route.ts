import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: { serviceId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = await prisma.service.findUnique({
      where: { id: params.serviceId },
      include: { employee: true }
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (service.employeeId !== decoded.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json();
    if (!status || !['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updatedService = await prisma.service.update({
      where: { id: params.serviceId },
      data: { status },
      include: {
        customer: true,
        employee: true,
        checklist: true,
        photos: true
      }
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Error updating service status:', error);
    return NextResponse.json({ error: 'Failed to update service status' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { serviceId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = await prisma.service.findUnique({
      where: { id: params.serviceId },
      include: {
        customer: true,
        employee: true,
        checklist: true,
        photos: true
      }
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Only allow access if user is the customer or employee
    if (decoded.role === 'CUSTOMER' && service.customerId !== decoded.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (decoded.role === 'EMPLOYEE' && service.employeeId !== decoded.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 });
  }
} 