import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/admin/coverage-areas/[id]
export async function GET(request, { params }) {
    try {
        // Verify admin session
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        // Get coverage area with employee information
        const coverageArea = await prisma.coverageArea.findUnique({
            where: { id },
            include: {
                employee: {
                    select: {
                        id: true,
                        User: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        if (!coverageArea) {
            return NextResponse.json({ error: 'Coverage area not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: coverageArea.id,
            zipCode: coverageArea.zipCode,
            employeeId: coverageArea.employeeId,
            employeeName: coverageArea.employee?.User?.name,
            employeeEmail: coverageArea.employee?.User?.email,
            travelDistance: coverageArea.travelDistance,
            active: coverageArea.active,
            createdAt: coverageArea.createdAt,
            updatedAt: coverageArea.updatedAt
        });
    } catch (error) {
        console.error('Error fetching coverage area:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/admin/coverage-areas/[id]
export async function PATCH(request, { params }) {
    try {
        // Verify admin session
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const body = await request.json();
        const { employeeId, travelDistance, active } = body;

        // Validate that at least one field is being updated
        if (!employeeId && !travelDistance && active === undefined) {
            return NextResponse.json({ 
                error: 'No fields to update',
                details: 'At least one field must be provided for update'
            }, { status: 400 });
        }

        // Check if coverage area exists
        const existingArea = await prisma.coverageArea.findUnique({
            where: { id }
        });

        if (!existingArea) {
            return NextResponse.json({ error: 'Coverage area not found' }, { status: 404 });
        }

        // If employeeId is being updated, verify the employee exists
        if (employeeId) {
            const employee = await prisma.employee.findUnique({
                where: { id: employeeId }
            });

            if (!employee) {
                return NextResponse.json({ 
                    error: 'Employee not found',
                    details: 'The specified employee does not exist'
                }, { status: 404 });
            }

            // Check if this would create a duplicate coverage area
            const duplicateArea = await prisma.coverageArea.findFirst({
                where: {
                    zipCode: existingArea.zipCode,
                    employeeId,
                    id: { not: id } // Exclude current area
                }
            });

            if (duplicateArea) {
                return NextResponse.json({ 
                    error: 'Coverage area already exists',
                    details: 'This employee already covers this ZIP code'
                }, { status: 409 });
            }
        }

        // Update coverage area
        const updatedArea = await prisma.coverageArea.update({
            where: { id },
            data: {
                ...(employeeId && { employeeId }),
                ...(travelDistance && { travelDistance: parseInt(travelDistance) }),
                ...(active !== undefined && { active }),
                updatedAt: new Date()
            },
            include: {
                employee: {
                    select: {
                        User: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json({
            id: updatedArea.id,
            zipCode: updatedArea.zipCode,
            employeeId: updatedArea.employeeId,
            employeeName: updatedArea.employee?.User?.name,
            employeeEmail: updatedArea.employee?.User?.email,
            travelDistance: updatedArea.travelDistance,
            active: updatedArea.active,
            createdAt: updatedArea.createdAt,
            updatedAt: updatedArea.updatedAt
        });
    } catch (error) {
        console.error('Error updating coverage area:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/coverage-areas/[id]
export async function DELETE(request, { params }) {
    try {
        // Verify admin session
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        // Check if coverage area exists
        const existingArea = await prisma.coverageArea.findUnique({
            where: { id }
        });

        if (!existingArea) {
            return NextResponse.json({ error: 'Coverage area not found' }, { status: 404 });
        }

        // Delete coverage area
        await prisma.coverageArea.delete({
            where: { id }
        });

        return NextResponse.json({ 
            message: 'Coverage area deleted successfully',
            id
        });
    } catch (error) {
        console.error('Error deleting coverage area:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// OPTIONS method for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Methods': 'GET, PATCH, DELETE',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        },
    });
} 