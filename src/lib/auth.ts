import { SignJWT, jwtVerify } from 'jose';
import { compare } from 'bcryptjs';
import { prisma } from './prisma';
import { cookies } from 'next/headers';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Initialize Redis and rate limiter only in non-test environment
let redis;
let ratelimit;

if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
  if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) {
    throw new Error('REDIS_URL and REDIS_TOKEN environment variables are required for rate limiting');
  }

  redis = new Redis({
    url: process.env.REDIS_URL,
    token: process.env.REDIS_TOKEN,
  });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
  });
} else {
  // Mock rate limiter for development
  ratelimit = {
    limit: async () => ({ success: true })
  };
}

// Create a consistent secret key for JWT
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const REFRESH_TOKEN_SECRET = new TextEncoder().encode(process.env.JWT_SECRET + '_refresh');

// Generate a device fingerprint
function generateFingerprint() {
  return randomBytes(32).toString('hex');
}

export async function generateTokens(user: any, deviceFingerprint: string) {
  // Generate access token
  const accessToken = await new SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
    customerId: user.customer?.id,
    employeeId: user.employee?.id,
    fingerprint: deviceFingerprint,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  // Generate refresh token
  const refreshToken = await new SignJWT({
    id: user.id,
    fingerprint: deviceFingerprint,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(REFRESH_TOKEN_SECRET);

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

  return { accessToken, refreshToken };
}

export async function login(email: string, password: string, fingerprint?: string) {
  // Check rate limit only in non-test environment
  if (process.env.NODE_ENV !== 'test' && ratelimit) {
    const { success } = await ratelimit.limit(email);
    if (!success) {
      throw new Error('Too many login attempts. Please try again later.');
    }
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

  // In test mode, compare plain text passwords
  const isValid = process.env.NODE_ENV === 'test'
    ? password === user.password
    : await compare(password, user.password);
    
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Generate device fingerprint if not provided
  const deviceFingerprint = fingerprint || generateFingerprint();

  // Generate tokens
  const { accessToken, refreshToken } = await generateTokens(user, deviceFingerprint);

  return { accessToken, refreshToken, user, deviceFingerprint };
}

export async function verifyToken(token: string, isRefreshToken = false) {
  try {
    console.log('Verifying token with secret:', isRefreshToken ? 'REFRESH' : 'ACCESS');
    const { payload } = await jwtVerify(token, isRefreshToken ? REFRESH_TOKEN_SECRET : JWT_SECRET, {
      algorithms: ['HS256']
    });
    console.log('Token payload:', payload);
    return payload as {
      id: string;
      email?: string;
      role?: string;
      customerId?: string;
      employeeId?: string;
      fingerprint?: string;
    };
  } catch (error) {
    console.error('Token verification error:', error);
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

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
    storedToken.user,
    storedToken.deviceFingerprint
  );

  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { isRevoked: true },
  });

  return { 
    accessToken, 
    refreshToken: newRefreshToken,
    user: storedToken.user
  };
}

export async function logout(userId: string) {
  // Revoke all refresh tokens for the user
  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { isRevoked: true },
  });
}

export async function validateUser(token: string, requiredRole?: string) {
  const payload = await verifyToken(token);
  if (!payload) {
    throw new Error('Invalid token');
  }

  if (requiredRole && payload.role !== requiredRole) {
    throw new Error('Insufficient permissions');
  }

  return {
    userId: payload.id,
    role: payload.role,
    customerId: payload.customerId,
    employeeId: payload.employeeId
  };
}

export async function verifyAuth(request: Request) {
  try {
    // Get tokens from cookies
    const cookieStore = cookies();
    const accessToken = await cookieStore.get('accessToken')?.value;
    const refreshToken = await cookieStore.get('refreshToken')?.value;
    const fingerprint = await cookieStore.get('fingerprint')?.value;

    if (!accessToken && !refreshToken) {
      return { success: false, error: 'No session found' };
    }

    // Try to verify access token first
    if (accessToken) {
      const payload = await verifyToken(accessToken);
      if (payload) {
        // Verify the user still exists and get their data
        const user = await prisma.user.findUnique({
          where: { id: payload.id },
          include: {
            customer: true,
            employee: true,
          },
        });

        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          return {
            success: true,
            session: {
              userId: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              customer: user.customer,
              employee: user.employee,
            },
          };
        }
      }
    }

    // If access token is invalid or expired, try refresh token
    if (refreshToken) {
      try {
        const { accessToken: newAccessToken, user } = await refreshToken(refreshToken, fingerprint);
        
        // Set new access token cookie
        const response = new NextResponse();
        response.cookies.set('accessToken', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 15 * 60, // 15 minutes
        });

        const { password: _, ...userWithoutPassword } = user;
        return {
          success: true,
          session: {
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            customer: user.customer,
            employee: user.employee,
          },
        };
      } catch (error) {
        console.error('Refresh token error:', error);
        return { success: false, error: 'Invalid refresh token' };
      }
    }

    return { success: false, error: 'Invalid session' };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

// ============= NextAuth.js Configuration =============
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              customer: true,
              employee: true,
            },
          });

          if (!user) {
            return null;
          }

          // Compare password
          const isValidPassword = await compare(credentials.password, user.password);
          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            customerId: user.customer?.id,
            employeeId: user.employee?.id,
          };
        } catch (error) {
          console.error('NextAuth authorize error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.customerId = user.customerId;
        token.employeeId = user.employeeId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.customerId = token.customerId as string;
        session.user.employeeId = token.employeeId as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.JWT_SECRET,
}; 