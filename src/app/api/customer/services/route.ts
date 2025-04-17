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
      select: { id: true }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const services = await prisma.service.findMany({
      where: {
        customerId: customer.id
      },
      include: {
        photos: true,
        employee: {
          select: {
            name: true,
            phone: true
          }
        }
      },
      orderBy: {
        scheduledFor: 'desc'
      },
      take: 10 // Get last 10 services
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Services error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await validateUser(token, 'CUSTOMER');

    const customer = await prisma.customer.findFirst({
      where: { userId },
      include: {
        subscription: true,
        preferences: true
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const { scheduledFor, preferences } = await request.json();

    // Update customer preferences if provided
    if (preferences) {
      await prisma.customerPreferences.upsert({
        where: { customerId: customer.id },
        create: {
          customerId: customer.id,
          ...preferences
        },
        update: preferences
      });
    }

    // Create new service
    const service = await prisma.service.create({
      data: {
        customerId: customer.id,
        scheduledFor: new Date(scheduledFor),
        status: 'SCHEDULED',
        preferences: preferences || customer.preferences
      },
      include: {
        photos: true,
        employee: {
          select: {
            name: true,
            phone: true
          }
        }
      }
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error('Service creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create service' },
      { status: 500 }
    );
  }
} 