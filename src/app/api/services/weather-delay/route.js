import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { requireAuth } from '@/lib/api-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function POST(req) {
    try {
        const user = await requireAuth(req);
        // Only admins can trigger weather delays
        if (user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { startDate, endDate, reason } = await req.json();
        if (!startDate || !endDate || !reason) {
            return NextResponse.json({ error: 'Start date, end date, and reason are required' }, { status: 400 });
        }
        const affectedServices = await prisma.service.findMany({
            where: {
                scheduledDate: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
                status: {
                    in: ['SCHEDULED', 'CLAIMED'],
                },
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
        // Update all affected services
        const updatedServices = await Promise.all(affectedServices.map((service) => prisma.service.update({
            where: { id: service.id },
            data: {
                status: 'DELAYED',
                delayReason: `Weather Delay: ${reason}`,
                delayMinutes: 60, // Default 1-hour delay
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
        })));
        return NextResponse.json({
            message: 'Weather delay applied successfully',
            affectedServices: updatedServices.length,
            services: updatedServices,
        });
    }
    catch (error) {
        console.error('Error applying weather delay:', error);
        return NextResponse.json({ error: 'Failed to apply weather delay' }, { status: 500 });
    }
}
