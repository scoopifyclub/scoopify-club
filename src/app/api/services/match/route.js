import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { requireAuth } from '@/lib/api-auth';
export async function POST(req) {
    try {
        const user = await requireAuth(req);
        const { serviceId, employeeId } = await req.json();
        if (!serviceId || !employeeId) {
            return NextResponse.json({ error: 'Service ID and employee ID are required' }, { status: 400 });
        }
        // Only admins can manually match services
        if (user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            include: {
                customer: {
                    include: {
                        user: true,
                    },
                },
                employee: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }
        if (service.status !== 'AVAILABLE') {
            return NextResponse.json({ error: 'Service is not available for matching' }, { status: 400 });
        }
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                user: true,
            },
        });
        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }
        const updatedService = await prisma.service.update({
            where: { id: serviceId },
            data: {
                employeeId,
                status: 'CLAIMED',
                claimedAt: new Date(),
            },
            include: {
                customer: {
                    include: {
                        user: true,
                    },
                },
                employee: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        return NextResponse.json(updatedService);
    }
    catch (error) {
        console.error('Error matching service:', error);
        return NextResponse.json({ error: 'Failed to match service' }, { status: 500 });
    }
}
