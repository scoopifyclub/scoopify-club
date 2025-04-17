import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(
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

    const { latitude, longitude } = await request.json();

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

    if (service.status !== 'CLAIMED') {
      return NextResponse.json({ error: 'Service must be claimed first' }, { status: 400 });
    }

    // Create location record
    await prisma.location.create({
      data: {
        serviceId: params.serviceId,
        latitude,
        longitude
      }
    });

    // Update service status
    const updatedService = await prisma.service.update({
      where: { id: params.serviceId },
      data: { status: 'ARRIVED' },
      include: {
        customer: {
          select: {
            name: true,
            address: true,
            gateCode: true
          }
        }
      }
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Error checking in:', error);
    return NextResponse.json({ error: 'Failed to check in' }, { status: 500 });
  }
} 