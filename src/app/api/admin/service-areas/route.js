import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const areas = await prisma.serviceArea.findMany();
    return NextResponse.json({ areas });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch service areas' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, zipCodes } = body;
    if (!name || !zipCodes || !Array.isArray(zipCodes) || zipCodes.length === 0) {
      return NextResponse.json({ error: 'Missing name or zip codes' }, { status: 400 });
    }
    await prisma.serviceArea.create({ data: { name, zipCodes } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create service area' }, { status: 500 });
  }
}
