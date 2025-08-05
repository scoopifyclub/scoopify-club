import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/api-auth';

export async function GET(request) {
  const { userId } = getUserFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get employee with user data
    const employee = await prisma.employee.findUnique({
      where: { userId },
      include: {
        User: true
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({
      name: employee.User.name,
      email: employee.User.email,
      phone: employee.phone || '',
      cashAppUsername: employee.cashAppUsername || '',
      preferredPaymentMethod: employee.preferredPaymentMethod || 'STRIPE'
    });

  } catch (error) {
    console.error('Error fetching employee profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const { userId } = getUserFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, email, phone, cashAppUsername, preferredPaymentMethod } = await request.json();

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { userId },
      include: {
        User: true
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Update user information
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || employee.User.name,
        email: email || employee.User.email
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
