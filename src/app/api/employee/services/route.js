import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/auth';
export async function GET(request) {
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
        // Get query parameters
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'AVAILABLE';
        // Get available services
        const services = await prisma.service.findMany({
            where: {
                status: status,
                // TODO: Add area filtering when implemented
            },
            include: {
                customer: {
                    include: {
                        address: true,
                        user: true
                    }
                },
                servicePlan: true,
                photos: true
            },
            orderBy: {
                scheduledDate: 'asc'
            }
        });
        return NextResponse.json(services);
    }
    catch (error) {
        console.error('Error fetching services:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function POST(req) {
    var _a;
    try {
        const token = (_a = req.headers.get('authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'EMPLOYEE') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { serviceId } = await req.json();
        if (!serviceId) {
            return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
        }
        // Claim the service
        const updatedService = await prisma.service.update({
            where: {
                id: serviceId,
                status: 'PENDING',
                employeeId: null,
            },
            data: {
                employeeId: decoded.userId,
                status: 'CLAIMED',
            },
            include: {
                customer: {
                    include: {
                        address: true,
                        preferences: true,
                    },
                },
            },
        });
        if (!updatedService) {
            return NextResponse.json({ error: 'Service not available for claiming' }, { status: 400 });
        }
        return NextResponse.json(updatedService);
    }
    catch (error) {
        console.error('Error claiming service:', error);
        return NextResponse.json({ error: 'Failed to claim service' }, { status: 500 });
    }
}
