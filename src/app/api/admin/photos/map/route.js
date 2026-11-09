import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

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

        const photos = await prisma.photo.findMany({
            where: {
                createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
            include: {
                service: {
                    include: {
                        customer: {
                            include: {
                                address: true,
                            },
                        },
                    },
                },
            },
        });

        const mapData = photos.map((photo) => ({
            id: photo.id,
            url: photo.url,
            createdAt: photo.createdAt,
            address: photo.service?.customer?.address,
            customerName: photo.service?.customer?.name,
            serviceId: photo.serviceId,
        }));

        return NextResponse.json(mapData);
    } catch (error) {
        console.error('Error fetching photo map data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch photo map data' },
            { status: 500 }
        );
    }
}
