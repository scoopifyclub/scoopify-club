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
      pathname === '/api/admin/login') {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('accessToken')?.value;
  console.log('Token found:', !!token);

  if (!token) {
    console.log('No token found, redirecting to login');
    return createRedirectResponse(request, getLoginPath(pathname), 'no_token');
  }

  try {
    // Verify token
    const payload = await verifyToken(token);
    console.log('Token payload:', payload);

    if (!payload) {
      console.log('Invalid token, redirecting to login');
      return createRedirectResponse(request, getLoginPath(pathname), 'invalid_token');
    }

    // Check if user has required role for the path
    if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
      console.log('Insufficient permissions for admin route');
      return createRedirectResponse(request, '/', 'insufficient_permissions');
    }

    if (pathname.startsWith('/employee') && payload.role !== 'EMPLOYEE') {
      console.log('Insufficient permissions for employee route');
      return createRedirectResponse(request, '/', 'insufficient_permissions');
    }

    // Add user info to request headers
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.id);
    response.headers.set('x-user-role', payload.role);

    return response;
  } catch (error) {
    console.error('Error in middleware:', error);
    return createRedirectResponse(request, getLoginPath(pathname), 'token_verification_error');
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