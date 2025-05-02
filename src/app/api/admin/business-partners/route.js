import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const businesses = await prisma.businessPartner.findMany({
      include: {
        referralCodes: true
      }
    });
    return NextResponse.json({ businesses });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 });
  }
}
