import { sign, verify } from 'jsonwebtoken';
import { compare } from 'bcryptjs';
import { prisma } from './prisma';
import { cookies } from 'next/headers';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) {
  throw new Error('REDIS_URL and REDIS_TOKEN environment variables are required for rate limiting');
}

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_SECRET + '_refresh';

// Initialize rate limiter
const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
});

export async function login(email: string, password: string) {
  // Check rate limit
  const { success } = await ratelimit.limit(email);
  if (!success) {
    throw new Error('Too many login attempts. Please try again later.');
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      customer: true,
      employee: true,
    },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isValid = await compare(password, user.password);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Generate access token
  const accessToken = sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customer?.id,
      employeeId: user.employee?.id,
    },
    JWT_SECRET,
    { expiresIn: '15m' } // Short-lived access token
  );

  // Generate refresh token
  const refreshToken = sign(
    {
      id: user.id,
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  // Store refresh token in database
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  return { accessToken, refreshToken, user };
}

export async function verifyToken(token: string, isRefreshToken = false) {
  try {
    return verify(token, isRefreshToken ? REFRESH_TOKEN_SECRET : JWT_SECRET) as {
      id: string;
      email?: string;
      role?: string;
      customerId?: string;
      employeeId?: string;
    };
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser(token?: string) {
  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    include: {
      customer: true,
      employee: true,
    },
  });

  return user;
}

export async function refreshToken(refreshToken: string) {
  const payload = await verifyToken(refreshToken, true);
  if (!payload) {
    throw new Error('Invalid refresh token');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    include: {
      customer: true,
      employee: true,
    },
  });

  if (!user || user.refreshToken !== refreshToken) {
    throw new Error('Invalid refresh token');
  }

  // Generate new access token
  const accessToken = sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customer?.id,
      employeeId: user.employee?.id,
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  return { accessToken, user };
}

export async function logout(userId: string) {
  // Invalidate refresh token
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
  return true;
} 