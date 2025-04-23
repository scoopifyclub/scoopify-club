import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    // Verify customer authorization
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    // Make sure the user is either the customer or an admin
    const { customerId } = await params;
    if (payload.role !== 'ADMIN' && 
       (payload.role !== 'CUSTOMER' || payload.customerId !== customerId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the service day from request body
    const { serviceDay } = await request.json();
    
    // Validate service day
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!validDays.includes(serviceDay)) {
      return NextResponse.json(
        { error: 'Invalid service day. Must be a valid day of the week.' },
        { status: 400 }
      );
    }

    // Update the customer record
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: { serviceDay },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Service day updated successfully',
      customer: {
        id: updatedCustomer.id,
        serviceDay: updatedCustomer.serviceDay,
        name: updatedCustomer.user.name,
      }
    });
  } catch (error) {
    console.error('Error updating service day:', error);
    return NextResponse.json(
      { error: 'Failed to update service day' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    // Verify customer authorization
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    // Make sure the user is either the customer or an admin
    const { customerId } = await params;
    if (payload.role !== 'ADMIN' && 
       (payload.role !== 'CUSTOMER' || payload.customerId !== customerId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the customer record
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        serviceDay: true,
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      serviceDay: customer.serviceDay,
      customer: {
        id: customer.id,
        name: customer.user.name,
      }
    });
  } catch (error) {
    console.error('Error getting service day:', error);
    return NextResponse.json(
      { error: 'Failed to get service day' },
      { status: 500 }
    );
  }
} 