import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import prisma from "@/lib/prisma";
// Define the GET handler with proper Next.js API route typing
export async function GET(request, context) {
    var _a;
    try {
        // Extract the employeeId from context.params
        const { employeeId } = context.params;
        // Get access token from cookies
        const cookieStore = await cookies();
        const accessToken = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Validate the token and check role
        try {
            const userData = await validateUser(accessToken);
            if (userData.role !== 'ADMIN') {
                return NextResponse.json({ error: 'Unauthorized, admin access required' }, { status: 401 });
            }
        }
        catch (err) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }
        // Get all services for the employee
        const services = await prisma.service.findMany({
            where: {
                employeeId,
            },
            include: {
                timeExtensions: true,
            },
        });
        // Calculate metrics
        const totalServices = services.length;
        const completedServices = services.filter(s => s.status === 'COMPLETED').length;
        const timeExtensions = services.reduce((acc, service) => acc + service.timeExtensions.length, 0);
        const cancellations = services.filter(s => s.status === 'CANCELLED').length;
        // Calculate average service time (placeholder - you'll need to implement actual time tracking)
        const averageTime = 30; // Default to 30 minutes
        return NextResponse.json({
            totalServices,
            completedServices,
            averageTime,
            timeExtensions,
            cancellations,
        });
    }
    catch (error) {
        console.error('Error fetching employee metrics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
