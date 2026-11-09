import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const zips = await prisma.coveragePriority.findMany({ orderBy: { createdAt: 'desc' } });
  // Export as CSV
  const csv = 'Zip Code\n' + zips.map(z => z.zipCode).join('\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="priority_zips.csv"'
    }
  });
}
