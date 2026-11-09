import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;
    console.log('🧪 Testing cookies...');
    
    // Get all cookies
    const cookieStore = request.cookies;
    const allCookies = {};
    
    cookieStore.forEach((value, name) => {
      allCookies[name] = value;
    });
    
    console.log('🍪 All cookies:', allCookies);
    
    const token = request.cookies.get('token')?.value;
    console.log('🎫 Token cookie:', token ? 'exists' : 'missing');
    
    return NextResponse.json({
      message: 'Cookie test endpoint',
      hasToken: !!token,
      token: token ? 'present' : 'missing',
      allCookies: Object.keys(allCookies)
    });
  } catch (error) {
    console.error('❌ Cookie test error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 