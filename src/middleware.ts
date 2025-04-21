import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { securityHeaders } from './middleware/security-headers'

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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log('Processing middleware request', {
    path: pathname,
    method: request.method,
    timestamp: new Date().toISOString()
  });

  // Skip middleware for login and public pages
  if (pathname === '/login' || 
      pathname === '/admin/login' || 
      pathname === '/employee/login' ||
      pathname === '/signup' ||
      pathname === '/api/auth/login' ||
      pathname === '/api/auth/customer-login' ||
      pathname === '/api/auth/employee-login' ||
      pathname === '/api/auth/logout' ||
      pathname === '/api/auth/refresh' ||
      pathname === '/api/auth/session' ||
      pathname === '/api/admin/login' ||
      pathname === '/api/admin/verify') {
    return NextResponse.next();
  }

  // Apply rate limiting for authentication endpoints
  if (pathname.includes('/login') || pathname.includes('/signup')) {
    const rateLimitResponse = await rateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  // Check if the path requires authentication
  if (pathname.startsWith('/admin') || 
      pathname.startsWith('/employee') || 
      pathname.startsWith('/customer') ||
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/api/admin') ||
      pathname.startsWith('/api/employee') ||
      pathname.startsWith('/api/customer')) {
    
    // Use only our custom JWT token
    const customToken = request.cookies.get('accessToken')?.value;
    console.log('Token from cookie:', customToken ? 'Present' : 'Missing');
    
    if (!customToken) {
      return createRedirectResponse(request, getLoginPath(pathname), 'No authentication token');
    }

    const payload = await verifyToken(customToken);
    console.log('Token verification result:', payload ? 'Valid' : 'Invalid');
    
    if (!payload) {
      console.log('Token verification failed', { token: customToken });
      return createRedirectResponse(request, getLoginPath(pathname), 'Invalid authentication token');
    }

    // Verify role is a valid role
    if (!payload.role || !VALID_ROLES.includes(payload.role as any)) {
      console.log('Invalid role in token', { role: payload.role });
      return createRedirectResponse(request, '/', 'Invalid role in token');
    }

    // Check role-based access
    if ((pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) && payload.role !== 'ADMIN') {
      return createRedirectResponse(request, '/', 'Insufficient permissions');
    }

    if ((pathname.startsWith('/employee') || pathname.startsWith('/api/employee')) && 
        payload.role !== 'EMPLOYEE' && payload.role !== 'ADMIN') {
      return createRedirectResponse(request, '/', 'Insufficient permissions');
    }

    if ((pathname.startsWith('/customer') || pathname.startsWith('/api/customer')) && 
        payload.role !== 'CUSTOMER' && payload.role !== 'ADMIN') {
      return createRedirectResponse(request, '/', 'Insufficient permissions');
    }
  }

  // Add security headers to all responses
  return securityHeaders(request);
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