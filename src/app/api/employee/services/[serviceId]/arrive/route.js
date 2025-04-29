import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/auth';
export async function POST(request, { params }) {
    var _a;
    try {
        // Verify employee authorization
        const token = (_a = request.headers.get('Authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'EMPLOYEE') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Update service status to IN_PROGRESS
        const service = await prisma.service.update({
            where: {
                id: (await params).serviceId,
                employeeId: decoded.id,
                status: 'ASSIGNED'
            },
            data: {
                status: 'IN_PROGRESS',
                startedAt: new Date()
            },
            include: {
                customer: {
                    include: {
                        address: true,
                        user: true
                    }
                },
                servicePlan: true
            }
        });
        if (!service) {
            return NextResponse.json({ error: 'Service not found or not assigned to you' }, { status: 404 });
        }
        return NextResponse.json(service);
    }
    catch (error) {
        console.error('Error marking service as in progress:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
