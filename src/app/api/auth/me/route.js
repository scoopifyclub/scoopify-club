import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { isCurrentSessionVersion } from '@/lib/jwt-utils';
import { getRequestAuthToken } from '@/lib/auth-cookies';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
  try {
    console.log('🔍 /api/auth/me called');

    const token = await getRequestAuthToken(request);

    if (!token) {
      console.log('❌ No authentication token found in cookies or headers');
      return NextResponse.json(
        { error: 'Unauthorized - No token found' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);

    if (!decoded) {
      console.log('❌ Token verification failed');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', decoded);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        password: true,
      }
    });

    if (!user) {
      console.log('❌ User not found in database');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!(await isCurrentSessionVersion(user, decoded.sv))) {
      return NextResponse.json(
        { error: 'Unauthorized - Session is no longer valid' },
        { status: 401 }
      );
    }

    const { password: _password, ...safeUser } = user;
    const response = NextResponse.json({
      user: safeUser
    });

    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');

    return response;

  } catch (error) {
    console.error('❌ Auth me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
