import { SignJWT, jwtVerify } from 'jose';
import { compare } from 'bcryptjs';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

// Generate a device fingerprint
function generateFingerprint() {
  return randomBytes(32).toString('hex');
}

// Generate admin token specifically for admin authentication
export async function generateAdminToken(user: any) {
  if (user.role !== 'ADMIN') {
    throw new Error('Only admin users can generate admin tokens');
  }
  
  // Generate admin token
  const adminToken = await new SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // 1 day
    .sign(new TextEncoder().encode(JWT_SECRET));

  return adminToken;
}

// Set admin cookie in response
export function setAdminCookie(response: NextResponse, token: string) {
  response.cookies.set('adminToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 // 24 hours
  });
  
  return response;
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
    .setExpirationTime('15m') // 15 minutes
    .sign(new TextEncoder().encode(JWT_SECRET));

  // Generate refresh token
  const refreshToken = await new SignJWT({
    id: user.id,
    fingerprint: deviceFingerprint,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(REFRESH_SECRET));

  return { accessToken, refreshToken };
}

export async function login(email: string, password: string, fingerprint?: string) {
  console.log('Login attempt for email:', email);
  
  // Find user in database
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      customer: true,
      employee: true
    }
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  console.log('Found user during login:', { id: user.id, email: user.email, role: user.role });

  // Compare password
  const isValid = await compare(password, user.password);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Generate device fingerprint if not provided
  const deviceFingerprint = fingerprint || generateFingerprint();

  // Generate tokens
  const { accessToken, refreshToken } = await generateTokens(user, deviceFingerprint);
  
  console.log('Generated tokens for user:', { id: user.id, tokenPayload: await verifyToken(accessToken) });

  return { accessToken, refreshToken, user, deviceFingerprint };
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET),
      { algorithms: ['HS256'] }
    );
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function refreshToken(oldRefreshToken: string, fingerprint?: string) {
  try {
    const { payload } = await jwtVerify(
      oldRefreshToken,
      new TextEncoder().encode(REFRESH_SECRET),
      { algorithms: ['HS256'] }
    );

    if (!payload || !payload.id) {
      throw new Error('Invalid refresh token');
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: {
        customer: true,
        employee: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      user,
      fingerprint || generateFingerprint()
    );

    return { accessToken, refreshToken: newRefreshToken, user };
  } catch (error) {
    console.error('Refresh token error:', error);
    throw new Error('Invalid refresh token');
  }
}

export async function validateUser(token: string, requiredRole?: string) {
  const payload = await verifyToken(token);
  if (!payload) {
    throw new Error('Invalid token');
  }

  console.log('Token payload:', payload);

  // Verify user exists and get latest data with relationships
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    include: {
      customer: {
        include: {
          address: true
        }
      },
      employee: true
    }
  });

  console.log('Found user:', user ? { id: user.id, email: user.email, role: user.role } : 'null');

  if (!user) {
    throw new Error('User not found');
  }

  // For customer role, ensure customer record exists
  if (requiredRole === 'CUSTOMER' && !user.customer) {
    throw new Error('Customer record not found');
  }

  // For employee role, ensure employee record exists
  if (requiredRole === 'EMPLOYEE' && !user.employee) {
    throw new Error('Employee record not found');
  }

  // Allow admins to access everything, otherwise check specific role
  if (requiredRole && user.role !== 'ADMIN' && user.role !== requiredRole) {
    throw new Error('Insufficient permissions');
  }

  return {
    userId: user.id,
    role: user.role,
    customerId: user.customer?.id,
    employeeId: user.employee?.id,
    customer: user.customer,
    employee: user.employee
  };
}

export async function verifyAuth(request: Request) {
  try {
    // Get tokens from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!accessToken && !refreshToken) {
      return { success: false, error: 'No session found' };
    }

    // Try to verify access token first
    if (accessToken) {
      const payload = await verifyToken(accessToken);
      if (payload) {
        // Find user in database
        const user = await prisma.user.findUnique({
          where: { id: payload.id },
          include: {
            customer: true,
            employee: true
          }
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
        const { accessToken: newAccessToken, user } = await refreshToken(refreshToken);
        
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

// NextAuth configuration
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
          console.log('NextAuth authorizing user:', credentials.email);
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              customer: true,
              employee: true
            }
          });

          if (!user) {
            console.log('User not found in database');
            return null;
          }

          const isValidPassword = await compare(credentials.password, user.password);
          if (!isValidPassword) {
            console.log('Invalid password for user');
            return null;
          }

          console.log('User successfully authenticated:', user.email, user.role);
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
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}; 