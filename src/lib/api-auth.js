import { NextResponse } from 'next/server';
import { withDatabase } from './prisma';
import { jwtVerify, SignJWT } from 'jose';
import { compare } from 'bcryptjs';

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

export async function getAuthUserFromCookies(request) {
  try {
    console.log('🍪 Getting auth user from cookies...');
    
    const token = request.cookies.get('token')?.value || request.cookies.get('accessToken')?.value;
    console.log('🎫 Token from cookies:', token ? 'found' : 'not found');
    
    if (!token) {
      console.log('❌ No token found in cookies');
      return null;
    }

    const decoded = await verifyToken(token);
    console.log('🔓 Token decoded:', decoded ? 'success' : 'failed');
    
    if (!decoded) {
      console.log('❌ Token verification failed');
      return null;
    }

    console.log('👤 Looking up user with ID:', decoded.userId);
    
    // Get the full user data from database using connection helper
    const user = await withDatabase(async (prisma) => {
      return await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        }
      });
    });

    console.log('👤 User found:', user ? `${user.email} (${user.role})` : 'not found');
    
    return user;
  } catch (error) {
    console.error('❌ Error getting auth user from cookies:', error);
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

export async function requireRole(requestOrRole, roleParam = null) {
  try {
    // Handle both requireRole(request, role) and requireRole(role) patterns
    let request, role;
    
    if (typeof requestOrRole === 'string') {
      // Called as requireRole(role)
      role = requestOrRole;
      request = null;
    } else {
      // Called as requireRole(request, role)
      request = requestOrRole;
      role = roleParam;
    }

    let token;
    
    if (request) {
      // Use Authorization header if request is provided
      token = request.headers.get('Authorization')?.split(' ')[1];
    } else {
      // Use cookies if no request provided
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      
      // Try different cookie names based on the role
      if (role === 'ADMIN') {
        token = cookieStore.get('adminToken')?.value;
      } else {
        token = cookieStore.get('token')?.value || cookieStore.get('accessToken')?.value;
      }
    }

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
    // Use database helper for login authentication
    const user = await withDatabase(async (prisma) => {
      // First get the user without includes
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return null;
      }

      // Verify password
      const isValidPassword = await compare(password, user.password);
      if (!isValidPassword) {
        return null;
      }

      return user;
    });

    return user;
  } catch (error) {
    console.error('Login error:', error);
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
  const user = await getAuthUserFromCookies(request);
  return user ? { user } : null;
}

export async function authenticateUser(email, password) {
  try {
    const user = await login(email, password);
    
    if (!user) {
      return null;
    }

    // Generate access token
    const accessToken = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'access'
    });

    if (!accessToken) {
      console.error('Failed to generate access token');
      return null;
    }

    return {
      user,
      accessToken
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
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

export async function getUserFromToken(request) {
  return getAuthUser(request);
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
