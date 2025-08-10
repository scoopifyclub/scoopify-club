import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToS3, deleteFromS3 } from '@/lib/s3';
import { validateUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;
        if (!token) {
            console.log('No access token found in cookies');
            return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
        }
        const decoded = await validateUserToken(token);
        console.log('Token verification result:', decoded ? 'success' : 'failed');
        if (!decoded || decoded.role !== 'ADMIN') {
            console.log('Invalid token or not admin:', decoded?.role);
            return NextResponse.json({ error: 'Unauthorized - Not admin' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const serviceId = searchParams.get('serviceId');
        const employeeId = searchParams.get('employeeId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        const where = {};
        if (serviceId) where.serviceId = serviceId;
        if (employeeId) where.employeeId = employeeId;

        const [photos, total] = await Promise.all([
            prisma.photo.findMany({
                where,
                include: {
                    service: {
                        include: {
                            customer: true,
                        },
                    },
                    employee: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.photo.count({ where }),
        ]);

        return NextResponse.json({
            photos,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit,
            },
        });
    }
    catch (error) {
        console.error('Error fetching photos:', error);
        return NextResponse.json(
            { error: 'Failed to fetch photos' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;
        if (!token) {
            console.log('No access token found in cookies');
            return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
        }
        const decoded = await validateUserToken(token);
        console.log('Token verification result:', decoded ? 'success' : 'failed');
        if (!decoded || decoded.role !== 'ADMIN') {
            console.log('Invalid token or not admin:', decoded?.role);
            return NextResponse.json({ error: 'Unauthorized - Not admin' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file');
        const serviceId = formData.get('serviceId');
        const employeeId = formData.get('employeeId');
        const notes = formData.get('notes');

        if (!file || !serviceId) {
            return NextResponse.json(
                { error: 'File and service ID are required' },
                { status: 400 }
            );
        }

        // Upload to S3
        const s3Key = await uploadToS3(file);

        // Create photo record
        const photo = await prisma.photo.create({
            data: {
                url: s3Key,
                serviceId,
                employeeId,
                notes,
                uploadedBy: user.id,
            },
            include: {
                service: {
                    include: {
                        customer: true,
                    },
                },
                employee: true,
            },
        });

        return NextResponse.json(photo);
    }
    catch (error) {
        console.error('Error uploading photo:', error);
        return NextResponse.json(
            { error: 'Failed to upload photo' },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;
        if (!token) {
            console.log('No access token found in cookies');
            return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
        }
        const decoded = await validateUserToken(token);
        console.log('Token verification result:', decoded ? 'success' : 'failed');
        if (!decoded || decoded.role !== 'ADMIN') {
            console.log('Invalid token or not admin:', decoded?.role);
            return NextResponse.json({ error: 'Unauthorized - Not admin' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const photoId = searchParams.get('id');

        if (!photoId) {
            return NextResponse.json(
                { error: 'Photo ID is required' },
                { status: 400 }
            );
        }

        const photo = await prisma.photo.findUnique({
            where: { id: photoId },
        });

        if (!photo) {
            return NextResponse.json(
                { error: 'Photo not found' },
                { status: 404 }
            );
        }

        // Delete from S3
        await deleteFromS3(photo.url);

        // Delete from database
        await prisma.photo.delete({
            where: { id: photoId },
        });

        return NextResponse.json({ message: 'Photo deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting photo:', error);
        return NextResponse.json(
            { error: 'Failed to delete photo' },
            { status: 500 }
        );
    }
}
