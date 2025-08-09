import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createUserToken } from '@/lib/jwt-utils';
import { sendVerificationEmail } from '@/lib/email-service';

export async function POST(request) {
  try {
    const { email, token } = await request.json();

    // Validate input
    if (!email || !token) {
      return NextResponse.json({ 
        error: 'Email and token are required' 
      }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { customer: true }
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json({ 
        error: 'Email is already verified' 
      }, { status: 400 });
    }

    // Verify token (you might want to implement a more secure token system)
    // For now, we'll use a simple approach
    const expectedToken = `verify_${user.id}_${user.email}`;
    if (token !== expectedToken) {
      return NextResponse.json({ 
        error: 'Invalid verification token' 
      }, { status: 400 });
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    });

    // Generate JWT token
    const jwtToken = await createUserToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Set authentication cookies
    const response = NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: true
      }
    });

    // Set secure cookies
    response.cookies.set('accessToken', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60 // 15 minutes
    });

    response.cookies.set('refreshToken', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;

  } catch (error) {
    console.error('Email verification failed:', error);
    return NextResponse.json({
      error: 'Email verification failed',
      details: error.message
    }, { status: 500 });
  }
}

// Send verification email
export async function PUT(request) {
  try {
    const { email } = await request.json();

    // Validate input
    if (!email) {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json({ 
        error: 'Email is already verified' 
      }, { status: 400 });
    }

    // Generate verification token
    const token = `verify_${user.id}_${user.email}`;

    // Send verification email
    await sendVerificationEmail(user.email, user.name, token);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Failed to send verification email:', error);
    return NextResponse.json({
      error: 'Failed to send verification email',
      details: error.message
    }, { status: 500 });
  }
}
