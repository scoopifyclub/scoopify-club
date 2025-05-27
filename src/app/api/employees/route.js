import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/api-auth';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { generateTokens, validateUser } from '@/lib/api-auth';
import { getZipCodesWithinRadiusGoogle } from '@/lib/googleZipRadius';
import crypto from 'crypto';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password, name, phone, serviceAreaId, zipCodes, homeZip, travelRange } = body;

        // Validate required fields
        if (!email || !password || !name || !phone) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        let linkedServiceAreaId = serviceAreaId;
        let createdZipCodes = zipCodes;
        // If homeZip and travelRange are provided, use Google Maps API to get zip codes
        if (homeZip && travelRange) {
            try {
                createdZipCodes = await getZipCodesWithinRadiusGoogle(homeZip, travelRange);
                if (!createdZipCodes || createdZipCodes.length === 0) {
                    return NextResponse.json({ error: 'No zip codes found for your area.' }, { status: 400 });
                }
            } catch (err) {
                return NextResponse.json({ error: 'Failed to calculate zip codes for your area. Please try again.' }, { status: 500 });
            }
        }
        // At least one of serviceAreaId or createdZipCodes must be provided
        if (!serviceAreaId && (!createdZipCodes || !Array.isArray(createdZipCodes) || createdZipCodes.length === 0)) {
            return NextResponse.json({ error: 'Please select a service area or provide zip codes.' }, { status: 400 });
        }
        // Create user and employee in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create user first
            const newUser = await tx.user.create({
                data: {
                    id: crypto.randomUUID(),
                    email,
                    name,
                    password: hashedPassword,
                    role: 'EMPLOYEE',
                    emailVerified: true,
                    updatedAt: new Date(),
                    createdAt: new Date()
                }
            });

            // If zip codes are present, create a new ServiceArea
            if (!linkedServiceAreaId && createdZipCodes && Array.isArray(createdZipCodes) && createdZipCodes.length > 0) {
                const newArea = await tx.serviceArea.create({
                    data: {
                        id: crypto.randomUUID(),
                        name: `${name}'s Area`,
                        zipCodes: createdZipCodes,
                        active: true
                    }
                });
                linkedServiceAreaId = newArea.id;
            }

            // Create employee
            const employee = await tx.employee.create({
                data: {
                    id: crypto.randomUUID(),
                    userId: newUser.id,
                    status: 'ACTIVE',
                    phone,
                    updatedAt: new Date(),
                    createdAt: new Date(),
                    serviceAreas: {
                        connect: linkedServiceAreaId ? [{ id: linkedServiceAreaId }] : []
                    }
                },
                include: {
                    user: true,
                    serviceAreas: true
                }
            });

            return employee;
        });

        return NextResponse.json({
            message: 'Employee created successfully',
            employee: {
                id: result.id,
                email: result.user.email,
                name: result.user.name,
                phone: result.phone,
                serviceAreas: result.serviceAreas
            }
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
