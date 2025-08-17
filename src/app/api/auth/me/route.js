import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/api-auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
  try {
    console.log('🔍 /api/auth/me called');
    
    const cookieStore = await cookies();
    
    // Log all available cookies for debugging
    const allCookies = cookieStore.getAll();
    console.log('🍪 All cookies found:', allCookies.map(c => `${c.name}=${c.value ? 'present' : 'missing'}`));
    
    // Try to get token from cookies (priority order: accessToken, refreshToken)
    let token = null;
    let tokenSource = '';
    
    // Check for accessToken
    const accessTokenCookie = cookieStore.get('accessToken');
    if (accessTokenCookie?.value) {
      token = accessTokenCookie.value;
      tokenSource = 'accessToken';
    }
    
    // Fallback to refreshToken if accessToken not found
    if (!token) {
      const refreshTokenCookie = cookieStore.get('refreshToken');
      if (refreshTokenCookie?.value) {
        token = refreshTokenCookie.value;
        tokenSource = 'refreshToken';
      }
    }
    
    // Also check Authorization header as fallback
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        tokenSource = 'Authorization header';
      }
    }

    console.log('📋 Token found from:', tokenSource, 'exists:', !!token);
    
    if (!token) {
      console.log('❌ No authentication token found in cookies or headers');
      return NextResponse.json(
        { error: 'Unauthorized - No token found' },
        { status: 401 }
      );
    }

    // Verify the token
    const decoded = await verifyToken(token);
    
    if (!decoded) {
      console.log('❌ Token verification failed');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', decoded);
    
    // Fetch full user data from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      }
    });
    
    if (!user) {
      console.log('❌ User not found in database');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const response = NextResponse.json({
      user: user
    });
    
    // Add CORS headers for admin dashboard
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