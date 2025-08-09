import { compare } from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createUserToken, createRefreshToken, validateUserToken } from './jwt-utils';

export async function signJWT(payload) {
  return await createUserToken(payload);
}

export async function verifyJWT(token) {
  return await validateUserToken(token);
}

export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  const payload = await validateUserToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  return user;
}

export async function authenticateUser(email, password) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isValid = await compare(password, user.password);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  const token = await createUserToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return { user, token };
}

export async function requireAuth(request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  return user;
}

export async function requireRole(role) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (user.role !== role) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  return user;
}

export async function verifyToken(token) {
  return verifyJWT(token);
}

export async function revokeUserTokenByFingerprint(fingerprint) {
  // Implement token revocation logic here if needed
  return true;
}

export async function refreshToken(token) {
  const payload = await verifyJWT(token);
  if (!payload) {
    return null;
  }

  const newToken = await signJWT({
    id: payload.id,
    email: payload.email,
    role: payload.role,
  });

  return newToken;
}

export const authOptions = {
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId;
        session.user.role = token.role;
      }
      return session;
    },
  },
}; 