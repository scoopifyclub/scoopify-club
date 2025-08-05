import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getZipCodesWithinRadiusGoogle } from '@/lib/googleZipRadius';

export async function POST(request) {
    try {
        const { zipCode } = await request.json();
        
        if (!zipCode) {
            return NextResponse.json({ error: 'Zip code is required' }, { status: 400 });
        }

        // Get all active scoopers and their coverage areas
        const scoopers = await prisma.employee.findMany({
            where: {
                status: 'ACTIVE',
                CoverageArea: {
                    some: {
                        active: true
                    }
                }
            },
            include: {
                CoverageArea: true
            }
        });

        // For each scooper, check if they can cover this zip code based on their travel distance
        const coveredByScoopers = await Promise.all(scoopers.map(async (scooper) => {
            // For each of the scooper's coverage areas
            for (const area of scooper.CoverageArea) {
                try {
                    // Get all zip codes within the scooper's travel distance
                    const coveredZips = await getZipCodesWithinRadiusGoogle(
                        area.zipCode,
                        area.travelDistance
                    );
                    
                    // If the requested zip code is within range, this scooper can cover it
                    if (coveredZips.includes(zipCode)) {
                        return {
                            scooperId: scooper.id,
                            distance: area.travelDistance,
                            baseZipCode: area.zipCode
                        };
                    }
                } catch (error) {
                    console.error(`Error checking coverage for scooper ${scooper.id}:`, error);
                    continue;
                }
            }
            return null;
        }));

        // Filter out null values and get the scoopers that can cover this area
        const availableScoopers = coveredByScoopers.filter(Boolean);

        return NextResponse.json({
            isCovered: availableScoopers.length > 0,
            availableScoopers,
            message: availableScoopers.length > 0 
                ? 'Service is available in your area!' 
                : 'Sorry, we don\'t have any scoopers available in your area yet.'
        });
    } catch (error) {
        console.error('Error checking coverage:', error);
        return NextResponse.json({ 
            error: 'Failed to check coverage',
            message: 'An error occurred while checking service availability'
        }, { status: 500 });
    }
} 