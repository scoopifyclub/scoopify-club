import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { securityHeaders } from './middleware/security-headers'
import { UserRole } from '@prisma/client'

// Valid roles in the system
const VALID_ROLES = ['ADMIN', 'EMPLOYEE', 'CUSTOMER'] as const;

// Helper function to create redirect response with logging
function createRedirectResponse(request: NextRequest, destination: string, reason: string) {
  console.log('Redirecting request', {
    from: request.nextUrl.pathname,
    to: destination,
    reason,
    timestamp: new Date().toISOString()
  });
  
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.headers.set('x-redirect-reason', reason);
  return response;
}

// Helper function to get login path based on role
function getLoginPath(pathname: string) {
  if (pathname.startsWith('/admin')) return '/admin/login';
  if (pathname.startsWith('/employee')) return '/employee/login';
  return '/login';
}

// List of paths that should skip middleware
const SKIP_PATHS = [
  '/login',
  '/admin/login',
  '/employee/login',
  '/signup',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
  '/styles',
  '/scripts'
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log('Processing middleware request', {
    path: pathname,
    method: request.method,
    timestamp: new Date().toISOString()
  });

  // Skip middleware for public paths
  if (SKIP_PATHS.some(path => pathname.startsWith(path))) {
    console.log('Skipping middleware for path:', pathname);
    return NextResponse.next();
  }

  try {
    // Get token from cookies
    const token = request.cookies.get('token')?.value;
    console.log('Token found:', !!token);

    if (!token) {
      console.log('No token found, redirecting to login');
      return createRedirectResponse(request, getLoginPath(pathname), 'No token found');
    }

    // Verify the token
    const payload = await verifyToken(token);
    if (!payload) {
      console.log('Token verification failed');
      const response = createRedirectResponse(request, getLoginPath(pathname), 'Token verification failed');
      response.cookies.delete('token');
      return response;
    }

    // Extract user role from token payload
    const userRole = payload.role;
    if (!userRole || !VALID_ROLES.includes(userRole as any)) {
      console.log('Invalid role in token');
      return createRedirectResponse(request, getLoginPath(pathname), 'Invalid role');
    }

    // Check if user has access to the requested path
    if (pathname.startsWith('/admin') && userRole !== UserRole.ADMIN) {
      console.log('Unauthorized access to admin area');
      return createRedirectResponse(request, getLoginPath(pathname), 'Unauthorized access');
    }

    if (pathname.startsWith('/employee') && userRole !== UserRole.EMPLOYEE) {
      console.log('Unauthorized access to employee area');
      return createRedirectResponse(request, getLoginPath(pathname), 'Unauthorized access');
    }

    if (pathname.startsWith('/customer') && userRole !== UserRole.CUSTOMER) {
      console.log('Unauthorized access to customer area');
      return createRedirectResponse(request, getLoginPath(pathname), 'Unauthorized access');
    }

    // Apply rate limiting
    const ip = request.ip ?? '127.0.0.1';
    const { success, remaining } = await rateLimit.limit(ip);
    
    if (!success) {
      console.log('Rate limit exceeded for IP:', ip);
      // Calculate retry after in seconds (1 minute)
      const retryAfter = 60;
      return rateLimit.createLimitExceededResponse(retryAfter);
    }

    // Apply security headers
    const response = NextResponse.next();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return createRedirectResponse(request, getLoginPath(pathname), 'Internal server error');
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/employee/:path*',
    '/customer/:path*',
    '/dashboard/:path*',
    '/api/admin/:path*',
    '/api/employee/:path*',
    '/api/customer/:path*',
  ],
}