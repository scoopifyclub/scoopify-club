import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;
        if (!token) {
            console.log('No access token found in cookies');
            return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
        }
        const decoded = await validateUserToken(token);
        console.log('Token verification result:', decoded ? 'success' : 'failed');
        if (!decoded || decoded.role !== 'ADMIN') {
            console.log('Invalid token or not admin:', decoded?.role);
            return NextResponse.json({ error: 'Unauthorized - Not admin' }, { status: 401 });
        }

        // Since employeeActivity model doesn't exist, use Service model to track employee activity
        const activities = await prisma.service.findMany({
            where: {
                employeeId: { not: null }  // Only services with assigned employees
            },
            include: {
                employee: {
                    include: { User: true }
                },
                customer: {
                    include: { User: true }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            },
            take: 50
        });

        // Transform to activity format
        const formattedActivities = activities.map(service => ({
            id: service.id,
            type: 'service_update',
            employeeId: service.employeeId,
            employeeName: service.employee?.User?.name || 'Unknown',
            customerName: service.customer?.User?.name || 'Unknown',
            status: service.status,
            timestamp: service.updatedAt,
            serviceId: service.id
        }));

        return NextResponse.json(formattedActivities);
    }
    catch (error) {
        console.error('Error fetching employee activities:', error);
        return NextResponse.json(
            { error: 'Failed to fetch employee activities' },
            { status: 500 }
        );
    }
}
