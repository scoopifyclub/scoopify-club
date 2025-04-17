import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { areaId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const area = await prisma.serviceArea.findUnique({
      where: { id: params.areaId },
      include: {
        customers: {
          where: {
            status: 'ACTIVE',
            user: {
              isActive: true
            }
          },
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            },
            address: true
          }
        }
      }
    });

    if (!area) {
      return NextResponse.json({ error: 'Service area not found' }, { status: 404 });
    }

    const customers = area.customers.map(customer => ({
      id: customer.id,
      name: customer.user.name,
      address: customer.address.street,
      coordinates: [customer.address.latitude, customer.address.longitude],
      serviceDay: customer.serviceDay
    }));

    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Error fetching service area customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service area customers' },
      { status: 500 }
    );
  }
} 