import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


// Returns a list of zip codes with at least one active customer
export async function GET() {
  const zips = await prisma.customer.findMany({
    where: {
      status: 'ACTIVE',
      zipCode: { not: null }
    },
    select: { zipCode: true },
    distinct: ['zipCode']
  });
  return NextResponse.json(zips.map(z => z.zipCode));
}
