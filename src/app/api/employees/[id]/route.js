import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function GET(request, { params }) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || !['ADMIN', 'MANAGER'].includes(decoded.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const employee = await prisma.employee.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                serviceAreas: true,
                services: {
                    where: {
                        status: {
                            in: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED']
                        }
                    },
                    include: {
                        customer: {
                            include: {
                                user: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        },
                        serviceType: true
                    }
                }
            }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            employee: {
                id: employee.id,
                name: employee.user.name,
                email: employee.user.email,
                phone: employee.phone,
                status: employee.status,
                serviceAreas: employee.serviceAreas.map(area => area.zipCode),
                services: employee.services.map(service => ({
                    id: service.id,
                    date: service.date,
                    status: service.status,
                    customer: service.customer.user.name,
                    serviceType: service.serviceType.name,
                    price: service.price
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching employee:', error);
        return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const data = await request.json();
        const { name, email, phone, password, serviceAreas, status } = data;

        // Validate required fields
        if (!name || !email || !phone || !serviceAreas || !Array.isArray(serviceAreas)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if email is already used by another user
        const existingUser = await prisma.user.findFirst({
            where: {
                email,
                employee: {
                    id: {
                        not: id
                    }
                }
            }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
        }

        // Start transaction
        const result = await prisma.$transaction(async (prisma) => {
            // Update user
            const updateData = {
                name,
                email
            };

            if (password) {
                updateData.password = await bcrypt.hash(password, 10);
            }

            const employee = await prisma.employee.findUnique({
                where: { id },
                include: { user: true }
            });

            if (!employee) {
                throw new Error('Employee not found');
            }

            await prisma.user.update({
                where: { id: employee.userId },
                data: updateData
            });

            // Delete existing service areas
            await prisma.serviceArea.deleteMany({
                where: { employeeId: id }
            });

            // Update employee
            const updatedEmployee = await prisma.employee.update({
                where: { id },
                data: {
                    phone,
                    status: status || 'ACTIVE',
                    serviceAreas: {
                        create: serviceAreas.map(area => ({
                            zipCode: area
                        }))
                    }
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    },
                    serviceAreas: true
                }
            });

            return updatedEmployee;
        });

        return NextResponse.json({
            success: true,
            employee: {
                id: result.id,
                name: result.user.name,
                email: result.user.email,
                phone: result.phone,
                status: result.status,
                serviceAreas: result.serviceAreas.map(area => area.zipCode)
            }
        });
    } catch (error) {
        console.error('Error updating employee:', error);
        return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        // Check if employee exists
        const employee = await prisma.employee.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        // Delete in transaction to ensure all related data is removed
        await prisma.$transaction([
            // Delete service areas
            prisma.serviceArea.deleteMany({
                where: { employeeId: id }
            }),
            // Delete employee
            prisma.employee.delete({
                where: { id }
            }),
            // Delete user
            prisma.user.delete({
                where: { id: employee.userId }
            })
        ]);

        return NextResponse.json({
            success: true,
            message: 'Employee deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting employee:', error);
        return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
    }
} 