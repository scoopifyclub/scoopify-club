import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { securityHeaders } from './middleware/security-headers'

// Define enum directly to avoid Prisma Edge Runtime issues
const ROLES = {
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  CUSTOMER: 'CUSTOMER'
};

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
  '/api/auth/session',
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/callback',
  '/api/session',
  '/api/login',
  '/api/logout',
  '/api/refresh',
  '/api/csrf',
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
  '/styles',
  '/scripts'
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Skip middleware for certain paths - use exact matching for critical paths
  if (
    SKIP_PATHS.includes(path) || 
    SKIP_PATHS.some(skipPath => path.startsWith(skipPath)) ||
    path.includes('/api/auth/') ||
    path.includes('/_next/') ||
    path.includes('/favicon.ico')
  ) {
    console.log(`Skipping middleware for path: ${path}`);
    return NextResponse.next();
  }
  
  // Define public paths that don't require authentication
  const publicPaths = ['/', '/about', '/contact', '/services', '/pricing', '/login', '/signup', '/forgot-password', '/reset-password'];
  if (publicPaths.includes(path)) {
    console.log(`Public path, no auth required: ${path}`);
    return NextResponse.next();
  }
  
  // Apply rate limiting based on path type - only for non-auth paths
  let rateLimitResult = null
  
  // Skip rate limiting for auth-related paths
  if (!path.includes('/auth/') && !path.includes('/session')) {
    // For API routes, we can safely use the database-backed rate limiter
    if (path.startsWith('/api/')) {
      try {
        rateLimitResult = await rateLimit.limit(request)
      } catch (error) {
        console.error('Error with rate limiter', error)
        // If rate limiting fails, we'll just continue without it
      }
    }
    
    if (rateLimitResult) {
      return rateLimitResult
    }
  }

  // Check if the path is for the API
  if (path.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Check for authentication
  try {
    // Use cookies directly instead of getToken() to avoid token validation issues
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(cookie => {
        const [name, ...rest] = cookie.trim().split('=');
        return [name, rest.join('=')];
      })
    );
    
    const hasAccessToken = 'accessToken' in cookies;
    const hasRefreshToken = 'refreshToken' in cookies;
    
    console.log(`Auth check for ${path}:`, { 
      hasAccessToken, 
      hasRefreshToken 
    });

    // If there's no authentication at all, redirect to login
    if (!hasAccessToken && !hasRefreshToken) {
      console.log(`No auth tokens, redirecting to login from: ${path}`);
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // When in doubt, let the request through and let the page handle authentication
    // This prevents login loops caused by middleware redirecting too aggressively
    // The API endpoints and pages will do their own auth validation if needed
    return NextResponse.next();
  } catch (error) {
    console.error(`Middleware error for ${path}:`, error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 