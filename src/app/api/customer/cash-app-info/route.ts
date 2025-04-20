import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find customer
    const customer = await prisma.customer.findFirst({
      where: {
        user: {
          email: session.user.email
        }
      },
      select: {
        cashAppName: true
      }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ cashAppName: customer.cashAppName });
  } catch (error) {
    console.error('Error fetching Cash App info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get data from request
    const data = await request.json();
    const { cashAppName } = data;

    // Validate
    if (!cashAppName) {
      return NextResponse.json(
        { error: 'Cash App name is required' },
        { status: 400 }
      );
    }

    if (!cashAppName.startsWith('$')) {
      return NextResponse.json(
        { error: 'Cash App name must start with $' },
        { status: 400 }
      );
    }

    // Update customer
    const customer = await prisma.customer.updateMany({
      where: {
        user: {
          email: session.user.email
        }
      },
      data: {
        cashAppName
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Cash App information updated successfully' 
    });
  } catch (error) {
    console.error('Error updating Cash App info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 