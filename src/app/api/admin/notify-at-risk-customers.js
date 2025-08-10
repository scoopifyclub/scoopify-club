import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendCustomerAtRiskEmail } from '@/lib/email-service';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


// POST: Notify all customers in at-risk zips (customers, no scoopers)
export async function POST() {
  // Get all zips with at least one active customer
  const customerZips = await prisma.customer.findMany({
    where: { status: 'ACTIVE', zipCode: { not: null } },
    select: { zipCode: true },
    distinct: ['zipCode']
  });
  const allCustomerZips = customerZips.map(z => z.zipCode);

  // Get all zips with at least one active scooper
  const coveredZips = await prisma.coverageArea.findMany({
    where: { active: true },
    select: { zipCode: true },
    distinct: ['zipCode']
  });
  const allCoveredZips = coveredZips.map(z => z.zipCode);

  // Find at-risk zips
  const atRiskZips = allCustomerZips.filter(z => !allCoveredZips.includes(z));

  // Notify customers in at-risk zips
  let notified = 0;
  for (const zip of atRiskZips) {
    const customers = await prisma.customer.findMany({
      where: { status: 'ACTIVE', zipCode: zip },
      select: { email: true, name: true, zipCode: true }
    });
    for (const c of customers) {
      await sendCustomerAtRiskEmail(c.email, c.name, c.zipCode);
      notified++;
    }
  }
  return NextResponse.json({ success: true, notified, atRiskZips });
}
