import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireScooper } from '@/lib/job-claims';

export const runtime = 'nodejs';

/** Claimed / in-progress jobs for the signed-in scooper. */
export async function GET(request) {
    try {
        const auth = await requireScooper(request);
        if (!auth.ok) return auth.response;

        const assignments = await prisma.service.findMany({
            where: {
                employeeId: auth.employee.id,
                status: {
                    in: ['PENDING', 'SCHEDULED', 'IN_PROGRESS'],
                },
            },
            orderBy: {
                scheduledDate: 'asc',
            },
            include: {
                customer: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                        address: true,
                    },
                },
                servicePlan: true,
            },
        });

        return NextResponse.json({ assignments });
    } catch (error) {
        console.error('Error fetching employee assignments:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
