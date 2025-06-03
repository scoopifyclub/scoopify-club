import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/api-auth';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    console.log('🔍 /api/auth/me called');
    
    const cookieStore = await cookies();
    
    // Try to get token from cookies (priority order: adminToken, token, accessToken)
    let token = null;
    let tokenSource = '';
    
    if (cookieStore.get('adminToken')) {
      token = cookieStore.get('adminToken').value;
      tokenSource = 'adminToken';
    } else if (cookieStore.get('token')) {
      token = cookieStore.get('token').value;
      tokenSource = 'token';
    } else if (cookieStore.get('accessToken')) {
      token = cookieStore.get('accessToken').value;
      tokenSource = 'accessToken';
    }

    console.log('📋 Token found from:', tokenSource, 'exists:', !!token);
    
    if (!token) {
      console.log('❌ No authentication token found in cookies');
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
    
    return NextResponse.json({
      user: {
        id: decoded.id || decoded.userId,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      }
    });
  } catch (error) {
    console.error('❌ Auth me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 