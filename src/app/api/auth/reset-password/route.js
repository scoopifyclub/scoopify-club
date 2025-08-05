import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { sendPasswordResetEmail } from '@/lib/email-service';

// Request password reset
export async function POST(request) {
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
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token (you might want to implement a more secure token system)
    const resetToken = `reset_${user.id}_${Date.now()}`;
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Send password reset email
    await sendPasswordResetEmail(user.email, user.name, resetToken);

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Password reset request failed:', error);
    return NextResponse.json({
      error: 'Failed to process password reset request',
      details: error.message
    }, { status: 500 });
  }
}

// Reset password with token
export async function PUT(request) {
  try {
    const { token, newPassword } = await request.json();

    // Validate input
    if (!token || !newPassword) {
      return NextResponse.json({ 
        error: 'Token and new password are required' 
      }, { status: 400 });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json({ 
        error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
      }, { status: 400 });
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Token hasn't expired
        }
      }
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'Invalid or expired reset token' 
      }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        passwordChangedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Password reset failed:', error);
    return NextResponse.json({
      error: 'Failed to reset password',
      details: error.message
    }, { status: 500 });
  }
}

// Verify reset token
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ 
        error: 'Token is required' 
      }, { status: 400 });
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Token hasn't expired
        }
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'Invalid or expired reset token' 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Token verification failed:', error);
    return NextResponse.json({
      error: 'Failed to verify token',
      details: error.message
    }, { status: 500 });
  }
}
