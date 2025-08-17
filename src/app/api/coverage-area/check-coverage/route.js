import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkCustomerCoverage } from '@/lib/zip-proximity';

export async function POST(request) {
  try {
    const { zipCode } = await request.json();

    if (!zipCode) {
      return NextResponse.json(
        { error: 'ZIP code is required' },
        { status: 400 }
      );
    }

    // Get all active coverage areas from the database
    const activeCoverageAreas = await prisma.coverageArea.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        zipCode: true,
        employeeId: true,
        travelDistance: true,
        Employee: {
          select: {
            User: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Use proximity-based coverage checking
    const coverageResult = checkCustomerCoverage(zipCode, activeCoverageAreas);

    if (coverageResult.isCovered) {
      // Add scooper details to the response
      const scooperCoverage = activeCoverageAreas.find(
        coverage => coverage.employeeId === coverageResult.scooperId
      );

      return NextResponse.json({
        isCovered: true,
        scooperId: coverageResult.scooperId,
        scooperName: scooperCoverage?.Employee?.User?.name || 'Available Scooper',
        scooperZip: coverageResult.scooperZip,
        travelDistance: coverageResult.travelDistance,
        distance: coverageResult.distance,
        message: `Service available! Nearest scooper is ${coverageResult.distance.toFixed(1)} miles away.`
      });
    } else {
      return NextResponse.json({
        isCovered: false,
        reason: coverageResult.reason,
        message: 'No active scoopers available in your area.',
        suggestion: 'Consider signing up as a scooper to expand service coverage!'
      });
    }

  } catch (error) {
    console.error('Coverage check error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check coverage',
        isCovered: false,
        reason: 'System error occurred'
      },
      { status: 500 }
    );
  }
}
