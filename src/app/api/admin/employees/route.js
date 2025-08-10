import { requireRole } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { withAdminDatabase } from '@/lib/prisma';
import crypto from 'crypto';

// Force Node.js runtime for Prisma, crypto, and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
    try {
        const user = await requireRole('ADMIN');
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const employees = await withAdminDatabase(async (prisma) => {
            return await prisma.employee.findMany({
                include: {
                    User: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            createdAt: true,
                        },
                    },
                    services: {
                        select: {
                            id: true,
                            status: true,
                            scheduledDate: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
        });

        return NextResponse.json(employees);
    }
    catch (error) {
        console.error('❌ Error fetching employees:', error);
        
        if (error.code === 'P2024') {
            return NextResponse.json({ 
                error: 'Database connection timeout. Please try again.',
                code: 'CONNECTION_TIMEOUT' 
            }, { status: 503 });
        }
        
        return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = await requireRole('ADMIN');
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, email, phone, serviceAreas } = body;

        // Create user and employee in a transaction
        const result = await withAdminDatabase(async (prisma) => {
            return await prisma.$transaction(async (tx) => {
                // Create user first
                const newUser = await tx.user.create({
                    data: {
                        id: crypto.randomUUID(),
                        name,
                        email,
                        role: 'EMPLOYEE',
                        password: 'temporary_password', // This should be changed on first login
                        emailVerified: true
                    }
                });

                // Then create employee
                const employee = await tx.employee.create({
                    data: {
                        id: crypto.randomUUID(),
                        userId: newUser.id,
                        status: 'ACTIVE',
                        phone,
                        serviceAreas: {
                            create: serviceAreas?.map((zipCode) => ({
                                id: crypto.randomUUID(),
                                zipCode
                            })) || []
                        }
                    },
                    include: {
                        user: true,
                        serviceAreas: true
                    }
                });

                return employee;
            });
        });

        return NextResponse.json({ employee: result });
    }
    catch (error) {
        console.error('❌ Error creating employee:', error);
        
        if (error.code === 'P2024') {
            return NextResponse.json({ 
                error: 'Database connection timeout. Please try again.',
                code: 'CONNECTION_TIMEOUT' 
            }, { status: 503 });
        }
        
        return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const user = await requireRole('ADMIN');
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, ...data } = await request.json();

        const updatedEmployee = await withAdminDatabase(async (prisma) => {
            return await prisma.employee.update({
                where: { id },
                data,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            createdAt: true,
                        },
                    },
                },
            });
        });

        return NextResponse.json(updatedEmployee);
    }
    catch (error) {
        console.error('❌ Error updating employee:', error);
        
        if (error.code === 'P2024') {
            return NextResponse.json({ 
                error: 'Database connection timeout. Please try again.',
                code: 'CONNECTION_TIMEOUT' 
            }, { status: 503 });
        }
        
        return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const user = await requireRole('ADMIN');
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await request.json();

        await withAdminDatabase(async (prisma) => {
            return await prisma.employee.delete({
                where: { id },
            });
        });

        return NextResponse.json({ success: true });
    }
    catch (error) {
        console.error('❌ Error deleting employee:', error);
        
        if (error.code === 'P2024') {
            return NextResponse.json({ 
                error: 'Database connection timeout. Please try again.',
                code: 'CONNECTION_TIMEOUT' 
            }, { status: 503 });
        }
        
        return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
    }
}
