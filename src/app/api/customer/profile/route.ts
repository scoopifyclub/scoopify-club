import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';

// Helper function to get token from request
async function getTokenAndValidate(request: Request, role = 'CUSTOMER') {
  // Try header first
  let token = request.headers.get('authorization')?.split(' ')[1];
  
  // If no token in header, try cookies
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get('accessToken')?.value || cookieStore.get('accessToken_client')?.value;
  }
  
  // Still no token
  if (!token) {
    console.log('No token found in request headers or cookies');
    throw new Error('Unauthorized');
  }
  
  // Validate the token
  try {
    return await validateUser(token, role);
  } catch (error) {
    console.error('Token validation error:', error);
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    console.log('Customer profile GET request received');
    
    // Get and validate token
    const { userId } = await getTokenAndValidate(request, 'CUSTOMER');
    console.log('Token validated, userId:', userId);

    const customer = await prisma.customer.findFirst({
      where: { userId },
      include: {
        address: true,
        subscription: {
          include: {
            payments: true
          }
        }
      }
    });

    if (!customer) {
      console.log('Customer not found for userId:', userId);
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    console.log('Customer data retrieved successfully');
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Profile error:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log('Customer profile PUT request received');
    
    // Get and validate token
    const { userId } = await getTokenAndValidate(request, 'CUSTOMER');
    console.log('Token validated, userId:', userId);

    const body = await request.json();
    const {
      phone,
      gateCode,
      serviceDay,
      address,
      preferences
    } = body;

    console.log('Update data received:', { phone, gateCode, serviceDay, address, preferences });

    // First, find the customer to check if they have an address
    const existingCustomer = await prisma.customer.findFirst({
      where: { userId },
      include: { address: true }
    });

    if (!existingCustomer) {
      console.log('Customer not found for userId:', userId);
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Create the update data object
    const updateData: any = {};
    
    // Only include fields that are provided
    if (phone !== undefined) updateData.phone = phone;
    if (gateCode !== undefined) updateData.gateCode = gateCode;
    if (serviceDay !== undefined) updateData.serviceDay = serviceDay;
    
    // Handle address updates if address is provided
    if (address && Object.keys(address).length > 0) {
      updateData.address = {
        upsert: {
          create: {
            street: address.street || '',
            city: address.city || '',
            state: address.state || '',
            zipCode: address.zipCode || '',
          },
          update: {
            street: address.street || existingCustomer.address?.street || '',
            city: address.city || existingCustomer.address?.city || '',
            state: address.state || existingCustomer.address?.state || '',
            zipCode: address.zipCode || existingCustomer.address?.zipCode || '',
          }
        }
      };
    }
    
    // Handle preferences if provided
    if (preferences) {
      // Update preferences logic here if needed
    }

    console.log('About to update customer with data:', updateData);

    // Now update the customer with the correct data
    const customer = await prisma.customer.update({
      where: { userId },
      data: updateData,
      include: {
        address: true,
        subscription: {
          include: {
            payments: true
          }
        }
      },
    });

    console.log('Customer profile updated successfully');
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update profile' },
      { status: 500 }
    );
  }
} 