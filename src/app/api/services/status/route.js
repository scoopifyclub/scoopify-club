import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/auth';
export async function POST(request) {
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
        const { serviceId, status, notes, photos } = await request.json();
        if (!serviceId || !status) {
            return NextResponse.json({ error: 'Service ID and status are required' }, { status: 400 });
        }
        // Get employee details
        const employee = await prisma.employee.findFirst({
            where: { userId: decoded.id }
        });
        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }
        // Get the service
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            include: {
                customer: true
            }
        });
        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }
        if (service.employeeId !== employee.id) {
            return NextResponse.json({ error: 'You are not assigned to this service' }, { status: 400 });
        }
        // Update service status
        const updatedService = await prisma.service.update({
            where: { id: serviceId },
            data: {
                status,
                notes,
                completedAt: status === 'COMPLETED' ? new Date() : null
            }
        });
        // Create service photos if provided
        if (photos && photos.length > 0) {
            await prisma.$transaction(photos.map((photo) => prisma.servicePhoto.create({
                data: {
                    serviceId,
                    url: photo.url,
                    type: photo.type
                }
            })));
        }
        // Create notification for customer
        let notificationType = 'SERVICE_COMPLETED';
        let notificationTitle = 'Service Completed';
        let notificationMessage = 'Your service has been completed';
        switch (status) {
            case 'ARRIVED':
                notificationType = 'JOB_CLAIMED';
                notificationTitle = 'Employee Arrived';
                notificationMessage = 'The employee has arrived at your location';
                break;
            case 'IN_PROGRESS':
                notificationType = 'JOB_CLAIMED';
                notificationTitle = 'Service In Progress';
                notificationMessage = 'The employee has started the service';
                break;
            case 'COMPLETED':
                notificationType = 'SERVICE_COMPLETED';
                notificationTitle = 'Service Completed';
                notificationMessage = 'Your service has been completed';
                break;
        }
        await prisma.notification.create({
            data: {
                userId: service.customer.userId,
                type: notificationType,
                title: notificationTitle,
                message: notificationMessage,
                data: { serviceId: service.id }
            }
        });
        return NextResponse.json({
            service: updatedService,
            message: 'Service status updated successfully'
        });
    }
    catch (error) {
        console.error('Service status update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
