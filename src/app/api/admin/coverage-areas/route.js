import { NextResponse } from 'next/server';
import { withAdminDatabase } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        const coverageAreas = await withAdminDatabase(async (prisma) => {
            console.log('🗺️ Fetching admin coverage areas...');

            // Get all coverage areas with employee assignments
            const areas = await prisma.serviceArea.findMany({
                include: {
                    employee: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    zipCode: 'asc'
                }
            });

            // If no service areas exist, create some default ones
            if (areas.length === 0) {
                console.log('No coverage areas found, creating defaults...');
                
                // Create some default coverage areas
                const defaultAreas = [
                    { zipCode: '94568', status: true, notes: 'Downtown area' },
                    { zipCode: '94582', status: true, notes: 'North side' },
                    { zipCode: '94521', status: true, notes: 'West hills' },
                    { zipCode: '94537', status: true, notes: 'East district' },
                    { zipCode: '94598', status: true, notes: 'South region' }
                ];

                const createdAreas = await Promise.all(
                    defaultAreas.map(area => 
                        prisma.serviceArea.create({
                            data: {
                                zipCode: area.zipCode,
                                status: area.status,
                                notes: area.notes
                            }
                        })
                    )
                );

                return createdAreas.map(area => ({
                    ...area,
                    employee: null
                }));
            }

            return areas;
        });

        return NextResponse.json({
            success: true,
            coverageAreas: coverageAreas
        });

    } catch (error) {
        console.error('Error fetching coverage areas:', error);
        return NextResponse.json({ 
            success: false,
            error: 'Failed to fetch coverage areas' 
        }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        const body = await request.json();
        const { zipCode, status, notes, employeeId } = body;

        const newArea = await withAdminDatabase(async (prisma) => {
            console.log('🗺️ Creating new coverage area...');

            return await prisma.serviceArea.create({
                data: {
                    zipCode,
                    status: status ?? true,
                    notes: notes || '',
                    employeeId: employeeId || null
                },
                include: {
                    employee: {
                        include: {
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
        });

        return NextResponse.json({
            success: true,
            coverageArea: newArea
        });

    } catch (error) {
        console.error('Error creating coverage area:', error);
        return NextResponse.json({ 
            success: false,
            error: 'Failed to create coverage area' 
        }, { status: 500 });
    }
}
