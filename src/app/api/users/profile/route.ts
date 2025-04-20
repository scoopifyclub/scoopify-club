import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request as any);
    
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        customer: true,
        employee: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
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

export async function PUT(request: Request) {
  try {
    const user = await requireAuth(request as any);
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if email is already in use by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        id: { not: user.id }
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already in use' },
        { status: 400 }
      );
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.name,
        email: data.email,
        customer: {
          upsert: {
            create: {
              address: data.address ? {
                create: {
                  street: data.address.street,
                  city: data.address.city,
                  state: data.address.state,
                  zipCode: data.address.zipCode
                }
              } : undefined
            },
            update: {
              address: data.address ? {
                upsert: {
                  create: {
                    street: data.address.street,
                    city: data.address.city,
                    state: data.address.state,
                    zipCode: data.address.zipCode
                  },
                  update: {
                    street: data.address.street,
                    city: data.address.city,
                    state: data.address.state,
                    zipCode: data.address.zipCode
                  }
                }
              } : undefined
            },
          },
        },
      },
      include: {
        customer: {
          include: {
            address: true
          }
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    
    // Handle Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 400 }
        );
      }
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
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
} 