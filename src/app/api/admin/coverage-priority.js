import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List all priority zip codes
export async function GET(req) {
  const zips = await prisma.coveragePriority.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(zips);
}

// POST: Add a priority zip code
export async function POST(req) {
  const { zipCode } = await req.json();
  if (!zipCode || !/^[0-9]{5}$/.test(zipCode)) {
    return NextResponse.json({ error: 'Invalid zip code' }, { status: 400 });
  }
  const exists = await prisma.coveragePriority.findUnique({ where: { zipCode } });
  if (exists) {
    return NextResponse.json({ error: 'Zip code already marked as priority' }, { status: 400 });
  }
  const result = await prisma.coveragePriority.create({ data: { zipCode } });
  return NextResponse.json(result);
}

// DELETE: Remove a priority zip code
export async function DELETE(req) {
  const { zipCode } = await req.json();
  if (!zipCode) {
    return NextResponse.json({ error: 'Zip code required' }, { status: 400 });
  }
  await prisma.coveragePriority.delete({ where: { zipCode } });
  return NextResponse.json({ success: true });
}
