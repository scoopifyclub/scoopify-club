import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/auth-server';

// GET handler to fetch employee profile data
export async function GET(request) {
    try {
        const user = await requireRole('EMPLOYEE');
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const employee = await prisma.employee.findUnique({
            where: { userId: user.id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        if (!employee) {
            return NextResponse.json(
                { error: 'Employee not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(employee);
    }
    catch (error) {
        console.error('Error fetching employee profile:', error);
        return NextResponse.json(
            { error: 'Failed to fetch employee profile' },
            { status: 500 }
        );
    }
}

// PUT handler to update employee profile
export async function PUT(request) {
    try {
        const user = await requireRole('EMPLOYEE');
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const data = await request.json();
        const { name, email, phone } = data;

        const employee = await prisma.employee.update({
            where: { userId: user.id },
            data: {
                user: {
                    update: {
                        name,
                        email,
                    },
                },
                phone,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        return NextResponse.json(employee);
    }
    catch (error) {
        console.error('Error updating employee profile:', error);
        return NextResponse.json(
            { error: 'Failed to update employee profile' },
            { status: 500 }
        );
    }
}
