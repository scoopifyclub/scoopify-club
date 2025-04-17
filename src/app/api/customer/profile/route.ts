import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await validateUser(token, 'CUSTOMER');

    const customer = await prisma.customer.findFirst({
      where: { userId },
      include: {
        address: true,
        subscription: {
          include: {
            plan: true
          }
        },
        preferences: true
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await validateUser(token, 'CUSTOMER');

    const {
      phone,
      gateCode,
      serviceDay,
      address,
      preferences
    } = await request.json();

    const customer = await prisma.customer.update({
      where: { userId },
      data: {
        phone,
        gateCode,
        serviceDay,
        address: {
          update: {
            street: address.street,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
          },
        },
        preferences: {
          upsert: {
            create: preferences,
            update: preferences
          }
        }
      },
      include: {
        address: true,
        subscription: {
          include: {
            plan: true
          }
        },
        preferences: true
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update profile' },
      { status: 500 }
    );
  }
} 