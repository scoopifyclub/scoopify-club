import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { jobClaimErrorResponse } from '@/lib/job-claims';
import { deleteServicePhoto, toPhotoView } from '@/lib/service-photos';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

const fullName = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(' ') || null;

export async function GET(request) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        const { searchParams } = new URL(request.url);
        const serviceId = searchParams.get('serviceId');
        const employeeId = searchParams.get('employeeId');
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));

        const where = {};
        if (serviceId) where.serviceId = serviceId;
        if (employeeId) where.service = { employeeId };

        const [photos, total] = await Promise.all([
            prisma.servicePhoto.findMany({
                where,
                include: {
                    service: {
                        select: {
                            id: true,
                            status: true,
                            completedDate: true,
                            customer: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
                            employee: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.servicePhoto.count({ where }),
        ]);

        const views = await Promise.all(photos.map(async (photo) => ({
            ...(await toPhotoView(photo)),
            service: {
                id: photo.service.id,
                status: photo.service.status,
                completedDate: photo.service.completedDate,
                customerName: fullName(photo.service.customer?.user),
                employeeId: photo.service.employee?.id ?? null,
                employeeName: fullName(photo.service.employee?.user),
            },
        })));

        return NextResponse.json({
            photos: views,
            pagination: { total, pages: Math.ceil(total / limit), page, limit },
        }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    catch (error) {
        console.error('Error fetching photos:', error);
        return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        const { searchParams } = new URL(request.url);
        const photoId = searchParams.get('id');
        if (!photoId) {
            return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 });
        }
        const photo = await prisma.servicePhoto.findUnique({ where: { id: photoId }, select: { serviceId: true } });
        if (!photo) {
            return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
        }
        await deleteServicePhoto({ serviceId: photo.serviceId, photoId, isAdmin: true });
        return NextResponse.json({ message: 'Photo deleted successfully' });
    }
    catch (error) {
        return jobClaimErrorResponse(error, 'Failed to delete photo');
    }
}
