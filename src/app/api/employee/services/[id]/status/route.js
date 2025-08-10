import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/api-auth';
import { validateServiceStatus } from '@/lib/validations';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function PATCH(request, { params }) {
    var _a;
    try {
        const token = (_a = request.headers.get('Authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        const { status } = await request.json();
        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }
        const service = await prisma.service.findUnique({
            where: { id: (await params).serviceId },
            include: { employee: true }
        });
        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }
        // Validate status transition
        const validation = validateServiceStatus(service, status, decoded.id, decoded.role === 'ADMIN');
        if (!validation.isValid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        // Update service status
        const updatedService = await prisma.service.update({
            where: { id: (await params).serviceId },
            data: {
                status,
                completedDate: status === 'COMPLETED' ? new Date() : undefined
            },
            include: {
                customer: true,
                employee: true
            }
        });
        return NextResponse.json(updatedService);
    }
    catch (error) {
        console.error('Error updating service status:', error);
        return NextResponse.json({ error: 'Failed to update service status' }, { status: 500 });
    }
}
