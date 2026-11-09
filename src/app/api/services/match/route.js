import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { requireAdmin } from '@/lib/admin-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function POST(req) {
    try {
        const auth = await requireAdmin(req);
        if (!auth.ok) return auth.response;
        const { serviceId, employeeId } = await req.json();
        if (!serviceId || !employeeId) {
            return NextResponse.json({ error: 'Service ID and employee ID are required' }, { status: 400 });
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
