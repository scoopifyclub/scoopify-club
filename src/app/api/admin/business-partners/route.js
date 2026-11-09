import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;
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
