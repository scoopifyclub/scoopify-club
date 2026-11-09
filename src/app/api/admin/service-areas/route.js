import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;
    const areas = await prisma.serviceArea.findMany();
    return NextResponse.json({ areas });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch service areas' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;
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
