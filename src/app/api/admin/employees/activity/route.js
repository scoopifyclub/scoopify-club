import { requireRole } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    try {
        const user = await requireRole('ADMIN');
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const activities = await prisma.employeeActivity.findMany({
            include: {
                employee: {
                    include: { user: true }
                }
            },
            orderBy: {
                timestamp: 'desc'
            },
            take: 50
        });

        return NextResponse.json(activities);
    }
    catch (error) {
        console.error('Error fetching employee activities:', error);
        return NextResponse.json(
            { error: 'Failed to fetch employee activities' },
            { status: 500 }
        );
    }
}
