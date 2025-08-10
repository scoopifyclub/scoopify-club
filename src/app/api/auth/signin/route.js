import { authenticateUser } from '@/lib/api-auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const authResult = await authenticateUser(email, password);
    
    if (!authResult) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const { user, accessToken, refreshToken } = authResult;

    const cookieStore = await cookies();
    const accessCookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
    };
    
    const refreshCookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    };

    // Set both cookies for compatibility
    cookieStore.set('token', accessToken, accessCookieOptions);
    cookieStore.set('accessToken', accessToken, accessCookieOptions);
    cookieStore.set('refreshToken', refreshToken, refreshCookieOptions);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
