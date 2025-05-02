import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Returns historical daily counts of at-risk, covered, and priority zips
export async function GET() {
  // For simplicity, assume a CoverageHistory table exists or fallback to live data for now
  // We'll use live data for now (last 30 days)
  const days = 30;
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date);
    dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23,59,59,999);

    // Covered zips (scooper active on that day)
    const covered = await prisma.coverageArea.findMany({
      where: {
        active: true,
        updatedAt: { lte: dayEnd },
        createdAt: { lte: dayEnd }
      },
      select: { zipCode: true },
      distinct: ['zipCode']
    });
    const coveredZips = covered.map(z => z.zipCode);

    // Active customers
    const customers = await prisma.customer.findMany({
      where: {
        status: 'ACTIVE',
        zipCode: { not: null },
        createdAt: { lte: dayEnd }
      },
      select: { zipCode: true },
      distinct: ['zipCode']
    });
    const customerZips = customers.map(z => z.zipCode);

    // Priority zips
    const priority = await prisma.coveragePriority.findMany({
      where: { createdAt: { lte: dayEnd } },
      select: { zipCode: true },
      distinct: ['zipCode']
    });
    const priorityZips = priority.map(z => z.zipCode);

    // At-risk: customers but not covered
    const atRiskZips = customerZips.filter(z => !coveredZips.includes(z));

    result.push({
      date: dayStart.toISOString().slice(0,10),
      covered: coveredZips.length,
      atRisk: atRiskZips.length,
      priority: priorityZips.length,
    });
  }
  return NextResponse.json(result);
}
