import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { requireAuth } from '@/lib/api-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function POST(req, { params }) {
    try {
        const user = await requireAuth(req);
        const { id } = await params;
        // Only employees can claim services
        if (user.role !== 'EMPLOYEE') {
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
            return NextResponse.json({ error: 'Service is not available for claiming' }, { status: 400 });
        }
        if (service.employeeId) {
            return NextResponse.json({ error: 'Service is already claimed' }, { status: 400 });
        }
        const updatedService = await prisma.service.update({
            where: { id: serviceId },
            data: {
                employeeId: user.employeeId,
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
        console.error('Error claiming service:', error);
        return NextResponse.json({ error: 'Failed to claim service' }, { status: 500 });
    }
}
