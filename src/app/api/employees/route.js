import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { generateTokens, validateUser } from '@/lib/auth';

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

        const body = await request.json();
        const { email, password, name, phone, serviceAreas } = body;
        const deviceFingerprint = request.headers.get('x-device-fingerprint');

        if (!deviceFingerprint) {
            return NextResponse.json({ error: 'Device fingerprint is required' }, { status: 400 });
        }

        // Validate required fields
        if (!email || !password || !name || !phone || !serviceAreas) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if employee already exists
        const existingEmployee = await prisma.employee.findUnique({
            where: { email }
        });

        if (existingEmployee) {
            return NextResponse.json({ error: 'Employee already exists' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create employee
        const employee = await prisma.employee.create({
            data: {
                email,
                password: hashedPassword,
                name,
                phone,
                serviceAreas: {
                    create: serviceAreas.map(area => ({
                        name: area
                    }))
                }
            }
        });

        // Generate tokens
        const { accessToken, refreshToken } = await generateTokens(employee, deviceFingerprint);

        // Set refresh token in HTTP-only cookie
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        };

        // Create response with both tokens
        const response = NextResponse.json({
            message: 'Employee created successfully',
            employee: {
                id: employee.id,
                email: employee.email,
                name: employee.name,
                phone: employee.phone,
                serviceAreas: employee.serviceAreas
            },
            accessToken
        });

        // Set the refresh token cookie
        response.cookies.set('refreshToken', refreshToken, cookieOptions);

        return response;
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
