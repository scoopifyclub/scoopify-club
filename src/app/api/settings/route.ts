import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request as any);
    
    const settings = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        email: true,
        phone: true,
        notificationPreferences: true,
        customer: {
          select: {
            address: true,
            servicePreferences: true,
          },
        },
        employee: {
          select: {
            serviceAreas: true,
            availability: true,
          },
        },
      },
    });

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      if (error.message === 'Forbidden') {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuth(request as any);
    const data = await request.json();

    const updatedSettings = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.name,
        phone: data.phone,
        notificationPreferences: data.notificationPreferences,
        ...(user.role === 'CUSTOMER' && {
          customer: {
            update: {
              address: data.address,
              servicePreferences: data.servicePreferences,
            },
          },
        }),
        ...(user.role === 'EMPLOYEE' && {
          employee: {
            update: {
              serviceAreas: data.serviceAreas,
              availability: data.availability,
            },
          },
        }),
      },
      select: {
        name: true,
        email: true,
        phone: true,
        notificationPreferences: true,
        customer: {
          select: {
            address: true,
            servicePreferences: true,
          },
        },
        employee: {
          select: {
            serviceAreas: true,
            availability: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      if (error.message === 'Forbidden') {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 