import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { login } from '@/lib/auth';

export async function POST(request: Request) {
  console.log('Login request received');
  try {
    const body = await request.json();
    console.log('Request body parsed:', { email: body.email });
    
    const { email, password } = body;
    
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    console.log('Getting cookie store');
    const cookieStore = await cookies();
    const existingFingerprint = cookieStore.get('fingerprint')?.value;
    console.log('Existing fingerprint:', existingFingerprint ? 'Present' : 'Not found');

    console.log('Attempting login');
    const { accessToken, refreshToken, user, deviceFingerprint } = await login(email, password, existingFingerprint);
    console.log('Login successful for user:', { id: user.id, role: user.role });

    // Create response with user data
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        customerId: user.customer?.id,
        employeeId: user.employee?.id,
      },
      accessToken,
      refreshToken
    });

    console.log('Setting cookies');
    // Set HTTP-only cookies
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15 minutes
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    response.cookies.set('fingerprint', deviceFingerprint, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    console.log('Cookies set successfully');
    return response;
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof Error) {
      if (error.message.includes('Invalid email or password')) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }
      if (error.message.includes('Too many login attempts')) {
        return NextResponse.json(
          { error: 'Too many login attempts. Please try again later.' },
          { status: 429 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 401 }
    );
  }
} 