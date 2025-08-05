import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAdminNotification } from '@/lib/email-service';

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

  // Find zips with customers but no scoopers
  const atRiskZips = allCustomerZips.filter(z => !allCoveredZips.includes(z));

  if (atRiskZips.length > 0) {
    const msg = `The following zip codes have active customers but no active scoopers: ${atRiskZips.join(', ')}. Immediate recruiting is needed!`;
    await sendAdminNotification('URGENT: Coverage Risk Detected', msg);
    return NextResponse.json({ success: true, atRiskZips, notified: true });
  } else {
    return NextResponse.json({ success: true, atRiskZips: [], notified: false });
  }
}
