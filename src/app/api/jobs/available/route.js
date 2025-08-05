import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'EMPLOYEE') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get employee's service areas
        const employee = await prisma.employee.findUnique({
            where: { userId: decoded.id },
            include: { serviceAreas: true }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        // Get available jobs in employee's service areas
        const availableJobs = await prisma.service.findMany({
            where: {
                status: 'SCHEDULED',
                employeeId: null,
                serviceArea: {
                    zipCode: {
                        in: employee.serviceAreas.map(area => area.zipCode)
                    }
                }
            },
            include: {
                customer: {
                    include: {
                        user: {
                            select: {
                                name: true
                            }
                        },
                        address: true
                    }
                },
                servicePlan: true
            },
            orderBy: {
                scheduledDate: 'asc'
            }
        });

        return NextResponse.json({ 
            success: true, 
            jobs: availableJobs.map(job => ({
                id: job.id,
                scheduledDate: job.scheduledDate,
                customerName: job.customer.user.name,
                address: job.customer.address,
                servicePlan: job.servicePlan.name,
                potentialEarnings: job.potentialEarnings
            }))
        });
    } catch (error) {
        console.error('Error fetching available jobs:', error);
        return NextResponse.json({ error: 'Failed to fetch available jobs' }, { status: 500 });
    }
} 