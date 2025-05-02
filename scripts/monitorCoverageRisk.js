// This script checks for zips with active customers but no active scoopers and emails admins if any are found
import { prisma } from '../src/lib/prisma';
import { sendAdminNotification } from '../src/lib/email';

async function main() {
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
    const msg = `The following zip codes have active customers but no active scoopers: ${atRiskZips.join(', ')}.\nImmediate recruiting is needed!`;
    await sendAdminNotification('URGENT: Coverage Risk Detected', msg);
    console.log('Admin notified:', msg);
  } else {
    console.log('No at-risk zips detected.');
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
