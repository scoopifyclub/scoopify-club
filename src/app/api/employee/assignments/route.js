import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyAuth } from '@/lib/api-auth';
export async function GET(request) {
    try {
        // Verify employee authentication
        const auth = await verifyAuth(request);
        if (!auth.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (auth.session.role !== 'EMPLOYEE') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        // Get employee's assignments
        const assignments = await prisma.service.findMany({
            where: {
                employeeId: auth.session.employeeId,
                status: {
                    in: ['SCHEDULED', 'IN_PROGRESS']
                }
            },
            orderBy: {
                scheduledDate: 'asc'
            },
            include: {
                customer: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true
                            }
                        },
                        address: true
                    }
                },
                servicePlan: true
            }
        });
        return NextResponse.json({ assignments });
    }
    catch (error) {
        console.error('Error fetching employee assignments:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
