import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start and end dates are required' },
        { status: 400 }
      );
    }

    // Fetch services for the specified date range
    const services = await prisma.service.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        customer: {
          include: {
            user: true,
            address: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json(
      services.map((service) => ({
        id: service.id,
        customerName: service.customer.user.name,
        address: service.customer.address
          ? `${service.customer.address.street}, ${service.customer.address.city}, ${service.customer.address.state} ${service.customer.address.zipCode}`
          : 'No address provided',
        customerEmail: service.customer.user.email,
        customerPhone: service.customer.user.phone,
        numberOfDogs: service.numberOfDogs,
        date: service.date,
        status: service.status,
        notes: service.notes,
        latitude: service.customer.address?.latitude,
        longitude: service.customer.address?.longitude,
      }))
    );
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
} 