import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get query parameters
        const url = new URL(request.url);
        const latitude = parseFloat(url.searchParams.get('latitude'));
        const longitude = parseFloat(url.searchParams.get('longitude'));
        const radius = parseFloat(url.searchParams.get('radius') || '50'); // Default 50km radius

        if (isNaN(latitude) || isNaN(longitude)) {
            return NextResponse.json({ error: 'Invalid location coordinates' }, { status: 400 });
        }

        // Calculate bounding box for rough filtering
        const kmPerDegree = 111.32; // Approximate km per degree at the equator
        const latDelta = radius / kmPerDegree;
        const lonDelta = radius / (kmPerDegree * Math.cos(latitude * Math.PI / 180));

        const jobs = await prisma.job.findMany({
            where: {
                AND: [
                    {
                        latitude: {
                            gte: latitude - latDelta,
                            lte: latitude + latDelta,
                        },
                    },
                    {
                        longitude: {
                            gte: longitude - lonDelta,
                            lte: longitude + lonDelta,
                        },
                    },
                    {
                        status: 'AVAILABLE',
                    },
                ],
            },
            include: {
                client: {
                    select: {
                        name: true,
                        address: true,
                    },
                },
            },
        });

        // Calculate exact distances and filter
        const jobsWithDistance = jobs.map(job => {
            const distance = calculateDistance(
                latitude,
                longitude,
                job.latitude,
                job.longitude
            );
            return { ...job, distance };
        }).filter(job => job.distance <= radius)
          .sort((a, b) => a.distance - b.distance);

        return NextResponse.json(jobsWithDistance);
    } catch (error) {
        console.error('Error fetching available jobs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch available jobs' },
            { status: 500 }
        );
    }
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
} 