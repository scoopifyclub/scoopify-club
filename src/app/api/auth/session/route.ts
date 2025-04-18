import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // First check for token in cookies
    const cookieStore = cookies();
    const tokenCookie = await cookieStore.get('token');
    const token = tokenCookie?.value;

    if (!token) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    // Verify the token
    const decoded = verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      role: string;
      name: string;
    };

    // Get user with role-specific data
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        customer: true,
        employee: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 