import { NextResponse } from 'next/server';
import prisma from './prisma';
import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

export async function signToken(payload) {
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);
    return token;
  } catch (error) {
    console.error('Error signing token:', error);
    return null;
  }
}

export async function getAuthUser(request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return null;
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Error getting auth user:', error);
    return null;
  }
}

export async function validateUser(token) {
  try {
    const decoded = await verifyToken(token);
    if (!decoded) {
      return null;
    }

    return {
      userId: decoded.userId,
      role: decoded.role,
    };
  } catch (error) {
    console.error('Error validating user:', error);
    return null;
  }
}

export async function requireAuth(request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  return user;
}

export async function requireRole(role) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return null;
    }

    const user = await validateUser(token);
    if (!user || user.role !== role) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error requiring role:', error);
    return null;
  }
}

export async function generateTokens(user) {
  const accessToken = await signToken({
    userId: user.id,
    role: user.role,
  });

  const refreshToken = await signToken({
    userId: user.id,
    role: user.role,
    type: 'refresh',
  });

  return { accessToken, refreshToken };
}

export async function login(email, password) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        employee: true,
        customer: true,
      },
    });

    if (!user) {
      return null;
    }

    // In a real app, you would verify the password here
    // For now, we'll just return the user
    const tokens = await generateTokens(user);
    return { user, ...tokens };
  } catch (error) {
    console.error('Error logging in:', error);
    return null;
  }
}

export async function refreshToken(token) {
  try {
    const decoded = await verifyToken(token);
    if (!decoded || decoded.type !== 'refresh') {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return null;
    }

    const tokens = await generateTokens(user);
    return tokens;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

export async function getSession(request) {
  const user = await getAuthUser(request);
  return user ? { user } : null;
}

export async function authenticateUser(email, password) {
  return login(email, password);
}

export async function verifyAuth(request) {
  return getAuthUser(request);
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

export function withErrorHandler(handler) {
  return async function (request, ...args) {
    try {
      return await handler(request, ...args);
    } catch (error) {
      console.error('API Error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

export function withAuth(handler, options = {}) {
    return async (request, ...args) => {
        const user = await requireAuth(request, options);
        if (user instanceof NextResponse) {
            return user; // Return error response
        }
        return handler(request, user, ...args);
    };
}

export async function revokeUserTokenByFingerprint(fingerprint) {
  // In a real app, you would revoke the token in your database
  // For now, we'll just return true
  return true;
}

export function useAuth() {
  // This is a placeholder for the actual useAuth hook
  // You should implement this using your preferred state management solution
  return {
    user: null,
    isLoading: false,
    error: null,
  };
}
