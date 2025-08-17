import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Get all ZIP codes with active scoopers
export async function GET() {
  try {
    // Find all zip codes with at least one active scooper
    const activeAreas = await prisma.coverageArea.findMany({
      where: { active: true },
      select: { zipCode: true },
      distinct: ['zipCode']
    });
    
    const zipCodes = activeAreas.map(a => a.zipCode);
    return NextResponse.json(zipCodes);
  } catch (error) {
    console.error('Error fetching active ZIP codes:', error);
    return NextResponse.json({ error: 'Failed to fetch coverage areas' }, { status: 500 });
  }
}
