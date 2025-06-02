import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken, getAuthUserFromCookies } from '@/lib/api-auth';

export async function GET(request) {
    try {
        // Verify employee authorization using cookies
        const user = await getAuthUserFromCookies(request);
        if (!user || user.role !== 'EMPLOYEE') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'PENDING';

        // Get available services
        const services = await prisma.service.findMany({
            where: {
                status: status,
                employeeId: null, // Only show unassigned services
                // TODO: Add area filtering when implemented
            },
            include: {
                customer: {
                    include: {
                        address: true,
                        user: true
                    }
                },
                servicePlan: true,
                photos: true
            },
            orderBy: {
                scheduledDate: 'asc'
            }
        });

        return NextResponse.json(services);
    } catch (error) {
        console.error('Error fetching services:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getAuthUserFromCookies(req);
        if (!user || user.role !== 'EMPLOYEE') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { serviceId } = await req.json();
        if (!serviceId) {
            return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
        }

        // Get employee record
        const employee = await prisma.employee.findUnique({
            where: { userId: user.id }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });
        }

        // Claim the service
        const updatedService = await prisma.service.update({
            where: {
                id: serviceId,
                status: 'PENDING',
                employeeId: null,
            },
            data: {
                employeeId: employee.id,
                status: 'SCHEDULED',
            },
            include: {
                customer: {
                    include: {
                        address: true,
                        preferences: true,
                    },
                },
            },
        });

        if (!updatedService) {
            return NextResponse.json({ error: 'Service not available for claiming' }, { status: 400 });
        }

        return NextResponse.json(updatedService);
    } catch (error) {
        console.error('Error claiming service:', error);
        return NextResponse.json({ error: 'Failed to claim service' }, { status: 500 });
    }
}
