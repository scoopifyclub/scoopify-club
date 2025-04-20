import { NextResponse } from 'next/server';
import { login } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get existing fingerprint if it exists
    const existingFingerprint = cookies().get('fingerprint')?.value;

    const { accessToken, refreshToken, user, deviceFingerprint } = await login(email, password, existingFingerprint);

    // Set cookies
    cookies().set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60, // 15 minutes
    });

    cookies().set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Set device fingerprint cookie
    cookies().set('fingerprint', deviceFingerprint, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        customerId: user.customer?.id,
        employeeId: user.employee?.id,
      },
    }, {
      headers: {
        'Set-Cookie': `userRole=${user.role}; Path=/; Max-Age=${7 * 24 * 60 * 60}` // 7 days
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Too many login attempts')) {
        return NextResponse.json(
          { error: error.message },
          { status: 429 }
        );
      }
      if (error.message.includes('Invalid email or password')) {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        );
      }
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 