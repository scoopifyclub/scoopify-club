import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/api-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function POST(request, { params }) {
    var _a;
    try {
        // Verify customer authorization
        const token = (_a = request.headers.get('Authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'CUSTOMER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { id } = await params;
        // Get the service and verify ownership
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            include: {
                customer: true,
                employee: true
            }
        });
        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }
        if (service.customer.userId !== decoded.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Check if service can be cancelled (only scheduled services)
        if (service.status !== 'SCHEDULED') {
            return NextResponse.json({ error: 'Only scheduled services can be cancelled' }, { status: 400 });
        }
        // Check cancellation time limit (e.g., 24 hours before service)
        const serviceDatetime = new Date(service.scheduledDate);
        const now = new Date();
        const hoursUntilService = (serviceDatetime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilService < 24) {
            return NextResponse.json({ error: 'Services must be cancelled at least 24 hours in advance' }, { status: 400 });
        }
        // Start a transaction to update service and create delay record
        const result = await prisma.$transaction(async (tx) => {
            // Update service status to cancelled
            const updatedService = await tx.service.update({
                where: { id: serviceId },
                data: {
                    status: 'CANCELLED',
                    notes: 'Cancelled by customer'
                }
            });
            // Create a service delay record
            await tx.serviceDelay.create({
                data: {
                    serviceId: service.id,
                    reason: 'Customer requested to cancel service',
                    reportedById: decoded.id
                }
            });
            return updatedService;
        });
        return NextResponse.json(result);
    }
    catch (error) {
        console.error('Error cancelling service:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
