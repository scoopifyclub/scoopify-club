import { compare } from 'bcryptjs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createUserToken, createRefreshToken, validateUserToken, isCurrentSessionVersion } from './jwt-utils';
import { getRequestAuthToken } from './auth-cookies';

export async function signJWT(payload) {
  return await createUserToken(payload);
}

export async function verifyJWT(token) {
  return await validateUserToken(token);
}

/**
 * Current signed-in user from the unified accessToken session cookie
 * (or Authorization Bearer). Returns null when missing or revoked.
 */
export async function getSession(request) {
  const token = await getRequestAuthToken(request);
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
      password: true,
    },
  });

  if (!user || !(await isCurrentSessionVersion(user, payload.sv))) return null;

  const { password: _password, ...safeUser } = user;
  return safeUser;
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
    password: user.password,
  });

  return { user, token };
}

export async function requireAuth(request) {
  const user = await getSession(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  return user;
}

export async function requireRole(role, request) {
  const user = await getSession(request);
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
    id: payload.userId || payload.id,
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
