import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { toPhotoView } from '@/lib/service-photos';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: 'Start date and end date are required' },
                { status: 400 }
            );
        }

        const photos = await prisma.servicePhoto.findMany({
            where: {
                createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
            include: {
                service: {
                    select: {
                        location: { select: { latitude: true, longitude: true } },
                        customer: {
                            select: {
                                address: true,
                                user: { select: { firstName: true, lastName: true } },
                            },
                        },
                    },
                },
            },
        });

        const mapData = await Promise.all(photos.map(async (photo) => ({
            ...(await toPhotoView(photo)),
            address: photo.service?.customer?.address,
            location: photo.service?.location ?? null,
            customerName: [photo.service?.customer?.user?.firstName, photo.service?.customer?.user?.lastName].filter(Boolean).join(' ') || null,
        })));

        return NextResponse.json(mapData);
    } catch (error) {
        console.error('Error fetching photo map data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch photo map data' },
            { status: 500 }
        );
    }
}
