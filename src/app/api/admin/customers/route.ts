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
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        },
        address: true,
        subscription: {
          include: {
            plan: {
              select: {
                name: true,
                price: true,
                duration: true
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
      phone: customer.user.phone,
      address: customer.address ? {
        street: customer.address.street,
        city: customer.address.city,
        state: customer.address.state,
        zipCode: customer.address.zipCode
      } : null,
      serviceDay: customer.serviceDay,
      subscription: customer.subscription ? {
        id: customer.subscription.id,
        status: customer.subscription.status,
        plan: {
          name: customer.subscription.plan.name,
          price: customer.subscription.plan.price,
          frequency: customer.subscription.plan.duration
        }
      } : null
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