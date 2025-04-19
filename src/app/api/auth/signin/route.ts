import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateTokens } from '@/lib/auth';
import { z } from 'zod';

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  deviceFingerprint: z.string()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, deviceFingerprint } = signinSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user, deviceFingerprint);

    // Return tokens and user data
    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 