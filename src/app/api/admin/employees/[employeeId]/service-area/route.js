import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) {
      console.log('No access token found in cookies');
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }
    const decoded = await validateUserToken(token);
    console.log('Token verification result:', decoded ? 'success' : 'failed');
    if (!decoded || decoded.role !== 'ADMIN') {
      console.log('Invalid token or not admin:', decoded?.role);
      return NextResponse.json({ error: 'Unauthorized - Not admin' }, { status: 401 });
    }

    const { employeeId } = params;

    const serviceArea = await prisma.serviceArea.findFirst({
      where: { employeeId },
      include: {
        employee: {
          include: { User: true }
        }
      }
    });

    return NextResponse.json(serviceArea);
  } catch (error) {
    console.error('Error fetching service area:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service area' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) {
      console.log('No access token found in cookies');
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }
    const decoded = await validateUserToken(token);
    console.log('Token verification result:', decoded ? 'success' : 'failed');
    if (!decoded || decoded.role !== 'ADMIN') {
      console.log('Invalid token or not admin:', decoded?.role);
      return NextResponse.json({ error: 'Unauthorized - Not admin' }, { status: 401 });
    }

    const { employeeId } = params;
    const data = await request.json();

    const serviceArea = await prisma.serviceArea.update({
      where: { employeeId },
      data,
      include: {
        employee: {
          include: { User: true }
        }
      }
    });

    return NextResponse.json(serviceArea);
  } catch (error) {
    console.error('Error updating service area:', error);
    return NextResponse.json(
      { error: 'Failed to update service area' },
      { status: 500 }
    );
  }
}
