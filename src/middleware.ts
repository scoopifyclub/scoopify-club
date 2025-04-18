import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { rateLimit } from './middleware/rate-limit'
import { securityHeaders } from './middleware/security-headers'
import { dbErrorHandler } from './middleware/db-error-handler'
import { Role } from '@prisma/client'

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

// Helper function to determine login path based on URL
function getLoginPath(url: string): string {
  if (url.includes('/admin')) {
    return '/admin/login';
  } else if (url.includes('/employee')) {
    return '/employee/login';
  }
  return '/login';
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log('Processing middleware request', {
    path: pathname,
    method: request.method,
    timestamp: new Date().toISOString()
  });

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Check if the path requires authentication
  if (pathname.startsWith('/admin') || 
      pathname.startsWith('/employee') || 
      pathname.startsWith('/customer') ||
      pathname.startsWith('/api/admin') ||
      pathname.startsWith('/api/employee') ||
      pathname.startsWith('/api/customer')) {
    
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return createRedirectResponse(request, getLoginPath(pathname), 'No authentication token');
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return createRedirectResponse(request, getLoginPath(pathname), 'Invalid authentication token');
    }

    // Check role-based access
    if (pathname.startsWith('/admin') && payload.role !== Role.ADMIN) {
      return createRedirectResponse(request, '/', 'Insufficient permissions');
    }

    if (pathname.startsWith('/employee') && payload.role !== Role.EMPLOYEE) {
      return createRedirectResponse(request, '/', 'Insufficient permissions');
    }

    if (pathname.startsWith('/customer') && payload.role !== Role.CUSTOMER) {
      return createRedirectResponse(request, '/', 'Insufficient permissions');
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/employee/:path*',
    '/customer/:path*',
    '/api/admin/:path*',
    '/api/employee/:path*',
    '/api/customer/:path*',
  ],
}