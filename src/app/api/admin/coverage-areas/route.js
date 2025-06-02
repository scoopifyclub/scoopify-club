import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/admin/coverage-areas
export async function GET(request) {
    try {
        // Verify admin session
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all coverage areas with employee information
        const coverageAreas = await prisma.coverageArea.findMany({
            include: {
                employee: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        // Transform the data to include employee name
        const transformedAreas = coverageAreas.map(area => ({
            id: area.id,
            zipCode: area.zipCode,
            employeeId: area.employeeId,
            employeeName: area.employee?.user?.name,
            travelDistance: area.travelDistance,
            active: area.active,
            createdAt: area.createdAt,
            updatedAt: area.updatedAt
        }));

        return NextResponse.json(transformedAreas);
    } catch (error) {
        console.error('Error fetching coverage areas:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/coverage-areas
export async function POST(request) {
    try {
        // Verify admin session
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { zipCode, employeeId, travelDistance, active = true } = body;

        // Validate required fields
        if (!zipCode || !employeeId || !travelDistance) {
            return NextResponse.json({ 
                error: 'Missing required fields',
                details: 'ZIP code, employee ID, and travel distance are required'
            }, { status: 400 });
        }

        // Validate ZIP code format (basic US ZIP code validation)
        const zipCodeRegex = /^\d{5}(-\d{4})?$/;
        if (!zipCodeRegex.test(zipCode)) {
            return NextResponse.json({ 
                error: 'Invalid ZIP code format',
                details: 'ZIP code must be in the format 12345 or 12345-6789'
            }, { status: 400 });
        }

        // Check if employee exists
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId }
        });

        if (!employee) {
            return NextResponse.json({ 
                error: 'Employee not found',
                details: 'The specified employee does not exist'
            }, { status: 404 });
        }

        // Check if coverage area already exists for this ZIP code and employee
        const existingArea = await prisma.coverageArea.findFirst({
            where: {
                zipCode,
                employeeId
            }
        });

        if (existingArea) {
            return NextResponse.json({ 
                error: 'Coverage area already exists',
                details: 'This employee already covers this ZIP code'
            }, { status: 409 });
        }

        // Create new coverage area
        const coverageArea = await prisma.coverageArea.create({
            data: {
                id: crypto.randomUUID(),
                zipCode,
                employeeId,
                travelDistance: parseInt(travelDistance),
                active,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            include: {
                employee: {
                    select: {
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json({
            id: coverageArea.id,
            zipCode: coverageArea.zipCode,
            employeeId: coverageArea.employeeId,
            employeeName: coverageArea.employee?.user?.name,
            travelDistance: coverageArea.travelDistance,
            active: coverageArea.active,
            createdAt: coverageArea.createdAt,
            updatedAt: coverageArea.updatedAt
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating coverage area:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// OPTIONS method for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Methods': 'GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        },
    });
} 