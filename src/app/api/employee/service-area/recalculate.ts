import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/api-auth';
import { getZipCodesWithinRadiusGoogle } from '@/lib/googleZipRadius';

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { homeZip, travelRange } = await request.json();
    if (!/^[0-9]{5}$/.test(homeZip)) {
      return NextResponse.json({ error: 'Invalid zip code format' }, { status: 400 });
    }
    if (!travelRange || typeof travelRange !== 'number') {
      return NextResponse.json({ error: 'Invalid travel range' }, { status: 400 });
    }

    // Fetch zip codes in radius using Google Maps API
    // Requires GOOGLE_MAPS_API_KEY in your environment
    const zipCodes: string[] = await getZipCodesWithinRadiusGoogle(homeZip, travelRange);
    if (!zipCodes.length) {
      return NextResponse.json({ error: 'No zip codes found for this area' }, { status: 400 });
    }

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { userId: user.userId },
      include: { serviceAreas: true }
    });
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Remove all previous service areas
    await prisma.serviceArea.deleteMany({ where: { employeeId: employee.id } });
    // Add new service areas
    const createdAreas = await prisma.$transaction(
      zipCodes.map(zip =>
        prisma.serviceArea.create({
          data: {
            employeeId: employee.id,
            zipCode: zip,
            travelRange,
            active: true
          }
        })
      )
    );
    // Set flag
    await prisma.employee.update({
      where: { id: employee.id },
      data: { hasSetServiceArea: true }
    });
    return NextResponse.json({ success: true, zipCodes });
  } catch (error) {
    console.error('Error recalculating service areas:', error);
    return NextResponse.json({ error: 'Failed to recalculate service areas' }, { status: 500 });
  }
}
