import { sign, verify } from 'jsonwebtoken';
import { compare } from 'bcryptjs';
import { prisma } from './prisma';
import { cookies } from 'next/headers';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { randomBytes } from 'crypto';

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

// Generate a device fingerprint
function generateFingerprint() {
  return randomBytes(32).toString('hex');
}

export async function login(email: string, password: string, fingerprint?: string) {
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

  // Generate device fingerprint if not provided
  const deviceFingerprint = fingerprint || generateFingerprint();

  // Generate access token
  const accessToken = sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customer?.id,
      employeeId: user.employee?.id,
      fingerprint: deviceFingerprint,
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  // Generate refresh token
  const refreshToken = sign(
    {
      id: user.id,
      fingerprint: deviceFingerprint,
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  // Store refresh token and fingerprint
  await prisma.$transaction([
    // Update user's device fingerprint
    prisma.user.update({
      where: { id: user.id },
      data: { deviceFingerprint },
    }),
    // Create new refresh token
    prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        deviceFingerprint,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    }),
  ]);

  return { accessToken, refreshToken, user, deviceFingerprint };
}

export async function verifyToken(token: string, isRefreshToken = false) {
  try {
    return verify(token, isRefreshToken ? REFRESH_TOKEN_SECRET : JWT_SECRET) as {
      id: string;
      email?: string;
      role?: string;
      customerId?: string;
      employeeId?: string;
      fingerprint?: string;
    };
  } catch (error) {
    return null;
  }
}

export async function refreshToken(oldRefreshToken: string, fingerprint?: string) {
  const payload = await verifyToken(oldRefreshToken, true);
  if (!payload) {
    throw new Error('Invalid refresh token');
  }

  // Find the refresh token in the database
  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      token: oldRefreshToken,
      userId: payload.id,
      isRevoked: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: {
        include: {
          customer: true,
          employee: true,
        },
      },
    },
  });

  if (!storedToken) {
    throw new Error('Invalid refresh token');
  }

  // Validate device fingerprint
  if (fingerprint && storedToken.deviceFingerprint !== fingerprint) {
    // Revoke all refresh tokens for this user as a security measure
    await prisma.refreshToken.updateMany({
      where: { userId: payload.id },
      data: { isRevoked: true },
    });
    throw new Error('Device fingerprint mismatch');
  }

  // Generate new access token
  const accessToken = sign(
    {
      id: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      customerId: storedToken.user.customer?.id,
      employeeId: storedToken.user.employee?.id,
      fingerprint: storedToken.deviceFingerprint,
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  // Generate new refresh token
  const newRefreshToken = sign(
    {
      id: storedToken.user.id,
      fingerprint: storedToken.deviceFingerprint,
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  // Revoke old token and create new one in a transaction
  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    }),
    prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: storedToken.user.id,
        deviceFingerprint: storedToken.deviceFingerprint,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    }),
  ]);

  return { accessToken, refreshToken: newRefreshToken, user: storedToken.user };
}

export async function logout(userId: string) {
  // Revoke all refresh tokens for the user
  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { isRevoked: true },
  });

  // Clear user's device fingerprint
  await prisma.user.update({
    where: { id: userId },
    data: { deviceFingerprint: null },
  });

  return true;
} 