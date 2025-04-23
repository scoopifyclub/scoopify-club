import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/auth';
import { validateServiceStatus } from '@/lib/validations';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { status } = await request.json();
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const service = await prisma.service.findUnique({
      where: { id: (await params).serviceId },
      include: { employee: true }
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Validate status transition
    const validation = validateServiceStatus(
      service,
      status,
      decoded.id,
      decoded.role === 'ADMIN'
    );

    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Update service status
    const updatedService = await prisma.service.update({
      where: { id: (await params).serviceId },
      data: {
        status,
        completedDate: status === 'COMPLETED' ? new Date() : undefined
      },
      include: {
        customer: true,
        employee: true
      }
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Error updating service status:', error);
    return NextResponse.json(
      { error: 'Failed to update service status' },
      { status: 500 }
    );
  }
} 