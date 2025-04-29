import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
export async function GET(request) {
    var _a;
    try {
        const token = (_a = request.headers.get('authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const employees = await prisma.employee.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        role: true
                    }
                },
                serviceAreas: true,
                services: {
                    where: {
                        status: 'SCHEDULED'
                    },
                    select: {
                        id: true,
                        scheduledDate: true,
                        customer: {
                            select: {
                                user: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        const formattedEmployees = employees.map(employee => ({
            id: employee.id,
            name: employee.user.name,
            email: employee.user.email,
            phone: employee.phone,
            status: employee.status,
            rating: employee.rating,
            completedJobs: employee.completedJobs,
            serviceAreas: employee.serviceAreas.map(area => area.zipCode),
            upcomingServices: employee.services.map(service => ({
                id: service.id,
                scheduledDate: service.scheduledDate,
                customerName: service.customer.user.name
            }))
        }));
        return NextResponse.json({ employees: formattedEmployees });
    }
    catch (error) {
        console.error('Error fetching employees:', error);
        return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
    }
}
export async function POST(request) {
    var _a;
    try {
        const token = (_a = request.headers.get('authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { name, email, phone, serviceAreas } = body;
        // Create user first
        const user = await prisma.user.create({
            data: {
                name,
                email,
                role: 'EMPLOYEE',
                password: 'temporary_password', // This should be changed on first login
                emailVerified: true
            }
        });
        // Then create employee
        const employee = await prisma.employee.create({
            data: {
                userId: user.id,
                status: 'ACTIVE',
                phone,
                serviceAreas: {
                    create: serviceAreas.map((zipCode) => ({
                        zipCode
                    }))
                }
            },
            include: {
                user: true,
                serviceAreas: true
            }
        });
        return NextResponse.json({ employee });
    }
    catch (error) {
        console.error('Error creating employee:', error);
        return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
    }
}
export async function PUT(request) {
    var _a;
    try {
        const token = (_a = request.headers.get('authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { id, updates } = body;
        const employee = await prisma.employee.update({
            where: { id },
            data: Object.assign(Object.assign({}, updates), { serviceAreas: updates.serviceAreas ? {
                    deleteMany: {},
                    create: updates.serviceAreas.map((zipCode) => ({
                        zipCode
                    }))
                } : undefined }),
            include: {
                user: true,
                serviceAreas: true
            }
        });
        return NextResponse.json({ employee });
    }
    catch (error) {
        console.error('Error updating employee:', error);
        return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
    }
}
export async function DELETE(request) {
    var _a;
    try {
        const token = (_a = request.headers.get('authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
        }
        // First get the user ID
        const employee = await prisma.employee.findUnique({
            where: { id },
            select: { userId: true }
        });
        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }
        // Delete the employee and user
        await prisma.employee.delete({
            where: { id }
        });
        await prisma.user.delete({
            where: { id: employee.userId }
        });
        return NextResponse.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting employee:', error);
        return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
    }
}
