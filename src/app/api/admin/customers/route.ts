import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customers = await prisma.customer.findMany({
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
        address: true,
        subscription: {
          select: {
            status: true,
            plan: {
              select: {
                name: true,
                price: true,
                frequency: true
              }
            }
          }
        }
      }
    });

    const formattedCustomers = customers.map(customer => ({
      id: customer.id,
      name: customer.user.name,
      email: customer.user.email,
      address: customer.address.street,
      coordinates: [customer.address.latitude, customer.address.longitude],
      serviceDay: customer.serviceDay,
      subscription: customer.subscription
    }));

    return NextResponse.json({ customers: formattedCustomers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
} 