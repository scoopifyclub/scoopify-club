import { NextResponse } from 'next/server';
import { verifyToken, generateTokens } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function POST(request) {
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

        const data = await request.json();
        const { email, password, name, phone, serviceAreas } = data;

        // Validate required fields
        if (!email || !password || !name || !phone || !serviceAreas || !Array.isArray(serviceAreas)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user and employee in a transaction
        const result = await prisma.$transaction(async (prisma) => {
            // Create user
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    role: 'EMPLOYEE'
                }
            });

            // Create employee profile
            const employee = await prisma.employee.create({
                data: {
                    userId: user.id,
                    phone,
                    status: 'ACTIVE',
                    serviceAreas: {
                        create: serviceAreas.map(area => ({
                            zipCode: area
                        }))
                    }
                }
            });

            return { user, employee };
        });

        // Generate fingerprint for the new employee
        const deviceFingerprint = Math.random().toString(36).substring(2, 15);

        // Generate tokens for the new employee
        const { accessToken } = await generateTokens({
            id: result.user.id,
            email: result.user.email,
            role: 'EMPLOYEE',
            employee: { id: result.employee.id }
        }, deviceFingerprint);

        return NextResponse.json({
            success: true,
            employee: {
                id: result.employee.id,
                name: result.user.name,
                email: result.user.email,
                phone: result.employee.phone,
                serviceAreas: serviceAreas
            },
            token: accessToken
        });
    } catch (error) {
        console.error('Error creating employee:', error);
        return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
    }
}

export async function GET(request) {
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

        const employees = await prisma.employee.findMany({
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

        return NextResponse.json({
            success: true,
            employees: employees.map(emp => ({
                id: emp.id,
                name: emp.user.name,
                email: emp.user.email,
                phone: emp.phone,
                status: emp.status,
                serviceAreas: emp.serviceAreas.map(area => area.zipCode)
            }))
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('id');
        if (!employeeId) {
            return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
        }
        await prisma.employee.delete({
            where: { id: employeeId },
        });
        return NextResponse.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting employee:', error);
        return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
    }
}
