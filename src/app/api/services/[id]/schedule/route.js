import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { requireAuth } from '@/lib/api-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function POST(req, { params }) {
    try {
        const user = await requireAuth(req);
        const { id } = await params;
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
        // Check if user has access to this service
        if (user.role === 'CUSTOMER' && service.customerId !== user.customerId ||
            user.role === 'EMPLOYEE' && service.employeeId !== user.employeeId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { scheduledDate } = await req.json();
        if (!scheduledDate) {
            return NextResponse.json({ error: 'Scheduled date is required' }, { status: 400 });
        }
        const updatedService = await prisma.service.update({
            where: { id: serviceId },
            data: {
                scheduledDate: new Date(scheduledDate),
                status: 'SCHEDULED',
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
        console.error('Error scheduling service:', error);
        return NextResponse.json({ error: 'Failed to schedule service' }, { status: 500 });
    }
}
