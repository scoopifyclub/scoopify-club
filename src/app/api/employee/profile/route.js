import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromCookies } from '@/lib/api-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


export async function GET(request) {
  const user = await getAuthUserFromCookies(request);
  console.log('🔍 Profile API - User from cookies:', user);
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get employee with user data
    const employee = await prisma.employee.findUnique({
      where: { userId: user.id },
      include: {
        user: true
      }
    });

    console.log('🔍 Profile API - Employee data:', employee);

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const profileData = {
      firstName: employee.user.firstName || '',
      lastName: employee.user.lastName || '',
      email: employee.user.email,
      phone: employee.phone || '',
      cashAppUsername: employee.cashAppUsername || '',
      preferredPaymentMethod: employee.preferredPaymentMethod || 'STRIPE'
    };

    console.log('🔍 Profile API - Returning profile data:', profileData);

    return NextResponse.json(profileData);

  } catch (error) {
    console.error('Error fetching employee profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const user = await getAuthUserFromCookies(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { firstName, lastName, email, phone, cashAppUsername, preferredPaymentMethod } = await request.json();

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { userId: user.id },
      include: {
        user: true
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

            // Update user information
        await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName: firstName || employee.user.firstName,
            lastName: lastName || employee.user.lastName,
            email: email || employee.user.email
          }
        });

    // Update employee information
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        phone: phone || employee.phone,
        cashAppUsername: cashAppUsername || employee.cashAppUsername,
        preferredPaymentMethod: preferredPaymentMethod || 'STRIPE'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating employee profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
