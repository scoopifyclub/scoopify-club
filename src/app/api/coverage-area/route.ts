import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/api-auth';

// GET: List coverage areas (optionally filter by zipCode or employeeId)
export async function GET(request: Request) {
  const { searchParams, pathname } = new URL(request.url);
  const zipCode = searchParams.get('zipCode');
  const employeeId = searchParams.get('employeeId');

  // Special endpoint: /api/coverage-area/active-zips
  if (pathname.endsWith('/active-zips')) {
    // Find all zip codes with at least one active scooper
    const activeAreas = await prisma.coverageArea.findMany({
      where: { active: true },
      select: { zipCode: true },
      distinct: ['zipCode']
    });
    const zipCodes = activeAreas.map(a => a.zipCode);
    return NextResponse.json(zipCodes);
  }

  const where: any = {};
  if (zipCode) where.zipCode = zipCode;
  if (employeeId) where.employeeId = employeeId;

  const areas = await prisma.coverageArea.findMany({ where, orderBy: { updatedAt: 'desc' } });
  return NextResponse.json(areas);
}

// POST: Add or update a coverage area for the current scooper
export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await request.json();
  if (!data.zipCode) {
    return NextResponse.json({ error: 'Zip code required' }, { status: 400 });
  }
  // Upsert coverage area for this scooper and zip code
  const area = await prisma.coverageArea.upsert({
    where: { zipCode_employeeId: { zipCode: data.zipCode, employeeId: user.userId } },
    update: { active: true, updatedAt: new Date() },
    create: {
      zipCode: data.zipCode,
      employeeId: user.userId,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  return NextResponse.json(area);
}

// DELETE: Remove a coverage area for the current scooper
export async function DELETE(request: Request) {
  const user = await getAuthUser(request);
  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await request.json();
  if (!data.zipCode) {
    return NextResponse.json({ error: 'Zip code required' }, { status: 400 });
  }
  await prisma.coverageArea.deleteMany({
    where: {
      zipCode: data.zipCode,
      employeeId: user.userId,
    },
  });
  return NextResponse.json({ success: true });
}
