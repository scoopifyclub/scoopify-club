import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const {
      name,
      email,
      phone,
      street,
      city,
      state,
      zipCode,
      cashAppTag,
    } = await request.json();

    // Create a new user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: 'EMPLOYEE',
      },
    });

    // Create the employee's address
    const address = await prisma.address.create({
      data: {
        street,
        city,
        state,
        zipCode,
      },
    });

    // Create the employee record
    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        name,
        email,
        phone,
        addressId: address.id,
        cashAppTag,
      },
    });

    return NextResponse.json({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
      },
      cashAppTag: employee.cashAppTag,
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        address: true,
        services: {
          select: {
            id: true,
            date: true,
            price: true,
            status: true,
          },
        },
      },
    });

    const formattedEmployees = employees.map(employee => ({
      id: employee.id,
      name: employee.user.name,
      email: employee.user.email,
      phone: employee.user.phone,
      address: {
        street: employee.address.street,
        city: employee.address.city,
        state: employee.address.state,
        zipCode: employee.address.zipCode,
      },
      cashAppTag: employee.cashAppTag,
      services: employee.services,
    }));

    return NextResponse.json(formattedEmployees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('id');

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    await prisma.employee.delete({
      where: { id: employeeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
} 