import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/api-auth';
import { isAfter } from 'date-fns';
export async function POST(req, { params }) {
    var _a;
    try {
        // Resolve params first
        const resolvedParams = await params;
        const jobId = resolvedParams.jobId;
        const token = (_a = req.headers.get('authorization')) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = await verifyToken(token);
        if (!decoded || decoded.role !== 'EMPLOYEE') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const service = await prisma.service.findUnique({
            where: { id: jobId },
            include: { employee: true, customer: { include: { user: true } } }
        });
        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }
        if (service.employeeId !== decoded.id) {
            return NextResponse.json({ error: 'Not assigned to this service' }, { status: 403 });
        }
        // Check if already checked in
        if (service.arrivedAt) {
            return NextResponse.json({ error: 'Already checked in' }, { status: 400 });
        }
        // Verify arrival deadline hasn't passed
        const now = new Date();
        if (isAfter(now, new Date(service.arrivalDeadline))) {
            // Release the job back to the pool
            await prisma.service.update({
                where: { id: jobId },
                data: {
                    employeeId: null,
                    status: 'SCHEDULED',
                    claimedAt: null,
                    arrivalDeadline: null,
                    timeExtensions: 0
                }
            });
            return NextResponse.json({ error: 'Arrival deadline has passed. Job has been released.' }, { status: 400 });
        }
        // Verify location (if coordinates provided)
        const { latitude, longitude } = await req.json();
        if (latitude && longitude) {
            const MAX_DISTANCE = 0.1; // Maximum allowed distance in miles
            const distance = calculateDistance(latitude, longitude, service.address.latitude, service.address.longitude);
            if (distance > MAX_DISTANCE) {
                return NextResponse.json({ error: 'You must be at the service location to check in' }, { status: 400 });
            }
        }
        // Update service status
        const updatedService = await prisma.service.update({
            where: { id: jobId },
            data: {
                status: 'IN_PROGRESS',
                arrivedAt: now
            }
        });
        // Create notification for customer
        await prisma.notification.create({
            data: {
                userId: service.customer.user.id,
                type: 'SERVICE_STARTED',
                title: 'Service Started',
                message: 'Your service provider has arrived and started working.',
                data: { serviceId: service.id }
            }
        });
        return NextResponse.json(updatedService);
    }
    catch (error) {
        console.error('Check-in error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3963; // Earth's radius in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
