import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { requireAdmin } from '@/lib/admin-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
    var _a;
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // Get today's services
        const todayServices = await prisma.service.count({
            where: {
                scheduledDate: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        });
        // Get upcoming services (after today)
        const upcomingServices = await prisma.service.count({
            where: {
                scheduledDate: {
                    gte: tomorrow,
                },
                status: 'PENDING',
            },
        });
        // Get completed services this month
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const completedServices = await prisma.service.count({
            where: {
                scheduledDate: {
                    gte: firstDayOfMonth,
                },
                status: 'COMPLETED',
            },
        });
        // Get pending services
        const pendingServices = await prisma.service.count({
            where: {
                status: 'PENDING',
            },
        });
        return NextResponse.json({
            today: todayServices,
            upcoming: upcomingServices,
            completed: completedServices,
            pending: pendingServices,
        });
    }
    catch (error) {
        console.error('Error fetching service overview:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
