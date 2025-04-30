import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/auth';
export async function POST(req, { params }) {
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
        const { id } = await params;
        // Update service status to IN_PROGRESS
        const updatedService = await prisma.service.update({
            where: {
                id: serviceId,
                employeeId: decoded.userId,
                status: 'CLAIMED',
            },
            data: {
                status: 'IN_PROGRESS',
                checkInTime: new Date(),
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
            return NextResponse.json({ error: 'Service not found or not claimed by you' }, { status: 404 });
        }
        return NextResponse.json(updatedService);
    }
    catch (error) {
        console.error('Error checking in to service:', error);
        return NextResponse.json({ error: 'Failed to check in to service' }, { status: 500 });
    }
}
