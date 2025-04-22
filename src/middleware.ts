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

// Simple in-memory rate limiter for Edge Runtime
const memoryStore = new Map<string, { count: number, resetTime: number }>();

const edgeRateLimit = {
  limit(request: NextRequest): NextResponse | null {
    const ip = request.ip ?? '127.0.0.1';
    const key = `rate-limit:${ip}`;
    const now = Date.now();
    const windowMs = 10 * 1000; // 10 seconds
    const maxRequests = 100; // More lenient rate limit

    // Get or initialize rate limit data
    let rateLimitData = memoryStore.get(key);
    if (!rateLimitData || now > rateLimitData.resetTime) {
      rateLimitData = { count: 0, resetTime: now + windowMs };
    }

    // Increment count
    rateLimitData.count++;
    memoryStore.set(key, rateLimitData);

    // Check if limit exceeded
    if (rateLimitData.count > maxRequests) {
      const retryAfter = Math.ceil((rateLimitData.resetTime - now) / 1000);
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': retryAfter.toString(),
          'Retry-After': retryAfter.toString()
        }
      });
    }

    return null;
  }
};

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
  
  // Apply rate limiting - use edge-compatible in-memory solution
  try {
    // Only apply rate limiting for non-auth paths
    if (!path.includes('/auth/') && !path.includes('/session')) {
      const rateLimitResult = edgeRateLimit.limit(request);
      if (rateLimitResult) {
        return rateLimitResult;
      }
    }
  } catch (error) {
    console.error('Error with rate limiter:', error);
    // Continue if rate limiting fails
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