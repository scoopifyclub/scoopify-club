import { NextRequest, NextResponse } from 'next/server';
import jwt, { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import CredentialsProvider from 'next-auth/providers/credentials';
import { hash, compare } from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthUser {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN';
}

export interface TokenPayload {
  userId: string;
  role: 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN';
}

export async function verifyAuth(request: NextRequest): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return { user: null, error: 'No authentication token found' };
    }

    try {
      const decoded = verify(token, process.env.JWT_SECRET!) as AuthUser;
      
      // Verify user still exists in database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true }
      });

      if (!user) {
        return { user: null, error: 'User account not found' };
      }

      return { user, error: null };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { user: null, error: 'Session expired. Please log in again.' };
      }
      return { user: null, error: 'Invalid authentication token' };
    }
  } catch (error) {
    console.error('Auth verification error:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

export function handleAuthError(error: string): NextResponse {
  const response = NextResponse.json(
    { message: error },
    { status: 401 }
  );
  
  // Clear auth cookies
  response.cookies.delete('token');
  response.cookies.delete('userType');
  
  // Add headers to prevent caching of auth errors
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

export function requireAuth(handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const { user, error } = await verifyAuth(request);
    
    if (error || !user) {
      return handleAuthError(error || 'Authentication required');
    }
    
    return handler(request, user);
  };
}

export function requireRole(roles: AuthUser['role'][]) {
  return (handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      const { user, error } = await verifyAuth(request);
      
      if (error || !user) {
        return handleAuthError(error || 'Authentication required');
      }
      
      if (!roles.includes(user.role)) {
        return NextResponse.json(
          { message: 'Insufficient permissions' },
          { status: 403 }
        );
      }
      
      return handler(request, user);
    };
  };
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export async function validateUser(token: string, requiredRole?: TokenPayload['role']): Promise<{ userId: string; role: string }> {
  const payload = verifyToken(token);
  
  if (requiredRole && payload.role !== requiredRole) {
    throw new Error('Unauthorized: Invalid role');
  }

  // Verify user exists in database
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return { userId: user.id, role: user.role };
}

export async function setAuthCookie(token: string) {
  cookies().set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

export async function clearAuthCookie() {
  cookies().delete('token');
}

export function isAdmin(payload: AuthUser) {
  return payload.role === 'ADMIN';
}

export function isEmployee(payload: AuthUser) {
  return payload.role === 'EMPLOYEE';
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            employee: true,
            customer: true,
          },
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          employeeId: user.employee?.id,
          customerId: user.customer?.id,
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          role: user.role,
          employeeId: user.employeeId,
          customerId: user.customerId,
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          role: token.role,
          employeeId: token.employeeId,
          customerId: token.customerId,
        },
      };
    },
  },
};

export const passwordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < passwordRequirements.minLength) {
    return {
      isValid: false,
      message: `Password must be at least ${passwordRequirements.minLength} characters long`,
    }
  }

  if (passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter',
    }
  }

  if (passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter',
    }
  }

  if (passwordRequirements.requireNumbers && !/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number',
    }
  }

  if (passwordRequirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one special character',
    }
  }

  return { isValid: true }
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
} 