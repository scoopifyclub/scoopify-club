import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/api-auth';
import { cookies } from 'next/headers';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


const VALID_PHOTO_TYPES = ['BEFORE', 'AFTER', 'ISSUE', 'OTHER'];

export async function POST(request, { params }) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || !['EMPLOYEE', 'ADMIN'].includes(decoded.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const { url, type, description } = await request.json();

        if (!url || !type) {
            return NextResponse.json({ error: 'URL and type are required' }, { status: 400 });
        }

        if (!VALID_PHOTO_TYPES.includes(type)) {
            return NextResponse.json({ error: 'Invalid photo type' }, { status: 400 });
        }

        // Get employee details if role is EMPLOYEE
        let employee;
        if (decoded.role === 'EMPLOYEE') {
            employee = await prisma.employee.findUnique({
                where: { userId: decoded.id }
            });

            if (!employee) {
                return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
            }
        }

        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            include: { employee: true }
        });

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        // If employee role, verify assignment
        if (decoded.role === 'EMPLOYEE' && service.employeeId !== employee.id) {
            return NextResponse.json({ error: 'You are not assigned to this service' }, { status: 403 });
        }

        const photo = await prisma.servicePhoto.create({
            data: {
                serviceId,
                url,
                type,
                description,
                uploadedBy: decoded.id
            }
        });

        return NextResponse.json({
            success: true,
            photo
        });
    } catch (error) {
        console.error('Error uploading photo:', error);
        return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
    }
}

export async function GET(request, { params }) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            include: {
                photos: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    include: {
                        uploadedByUser: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                customer: {
                    select: {
                        userId: true
                    }
                },
                employee: {
                    select: {
                        userId: true
                    }
                }
            }
        });

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        // Verify access rights
        const hasAccess = 
            decoded.role === 'ADMIN' ||
            (decoded.role === 'CUSTOMER' && service.customer.userId === decoded.id) ||
            (decoded.role === 'EMPLOYEE' && service.employee?.userId === decoded.id);

        if (!hasAccess) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json({
            success: true,
            photos: service.photos
        });
    } catch (error) {
        console.error('Error fetching photos:', error);
        return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded || !['EMPLOYEE', 'ADMIN'].includes(decoded.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const { photoId } = await request.json();

        if (!photoId) {
            return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 });
        }

        const photo = await prisma.servicePhoto.findUnique({
            where: { id: photoId },
            include: {
                service: {
                    include: {
                        employee: true
                    }
                }
            }
        });

        if (!photo) {
            return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
        }

        if (photo.service.id !== serviceId) {
            return NextResponse.json({ error: 'Photo does not belong to this service' }, { status: 400 });
        }

        // If employee role, verify they uploaded the photo or are assigned to the service
        if (decoded.role === 'EMPLOYEE') {
            const canDelete = 
                photo.uploadedBy === decoded.id || 
                photo.service.employee?.userId === decoded.id;

            if (!canDelete) {
                return NextResponse.json({ error: 'Unauthorized to delete this photo' }, { status: 403 });
            }
        }

        await prisma.servicePhoto.delete({
            where: { id: photoId }
        });

        return NextResponse.json({
            success: true,
            message: 'Photo deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting photo:', error);
        return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
    }
}
