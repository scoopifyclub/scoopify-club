import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { requireAuth } from '@/lib/api-auth';
export async function GET(req, { params }) {
    try {
        const user = await requireAuth(req);
        const { serviceId } = await params;
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            include: {
                customer: {
                    include: {
                        user: true,
                        address: true,
                    },
                },
                employee: {
                    include: {
                        user: true,
                    },
                },
                servicePlan: true,
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
        return NextResponse.json(service);
    }
    catch (error) {
        console.error('Error fetching service:', error);
        return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 });
    }
}
