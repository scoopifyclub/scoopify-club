import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/api-auth'

// Define paths that don't require authentication
const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
]

// Define paths that require specific roles
const roleRestrictedPaths = {
  '/admin': ['ADMIN', 'MANAGER'],
  '/admin/dashboard': ['ADMIN', 'MANAGER'],
  '/employee/dashboard': ['EMPLOYEE', 'ADMIN', 'MANAGER'],
  '/api/admin': ['ADMIN', 'MANAGER'],
  '/api/employee': ['EMPLOYEE', 'ADMIN', 'MANAGER'],
}

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Determine if this is an admin route
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const token = isAdminRoute
    ? request.cookies.get('adminToken')?.value
    : request.cookies.get('token')?.value;

  if (!token) {
    // Clear cookies if missing token for admin route
    const response = redirectToLogin(request);
    response.cookies.set('adminToken', '', { maxAge: 0, path: '/' });
    response.cookies.set('token', '', { maxAge: 0, path: '/' });
    return response;
  }

  try {
    // Verify token and get user data
    const user = await verifyToken(token);
    if (!user) {
      // Clear cookies if invalid token for admin route
      const response = redirectToLogin(request);
      response.cookies.set('adminToken', '', { maxAge: 0, path: '/' });
      response.cookies.set('token', '', { maxAge: 0, path: '/' });
      return response;
    }

    // Check role restrictions
    for (const [path, roles] of Object.entries(roleRestrictedPaths)) {
      if (pathname.startsWith(path) && !roles.includes(user.role)) {
        return new NextResponse(null, { status: 403 })
      }
    }

    // Add user info to headers for downstream use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-role', user.role)

    // Apply scheduling validation for service scheduling routes

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error('Middleware error:', error)
    return redirectToLogin(request)
  }
}

function redirectToLogin(request) {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.search = `?from=${encodeURIComponent(request.nextUrl.pathname)}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/webhooks routes
     * 2. /_next (Next.js internals)
     * 3. /static (static files)
     * 4. /favicon.ico, /sitemap.xml (static files)
     */
    '/((?!api/webhooks|_next/static|_next/image|favicon.ico|sitemap.xml).*)',
  ],
}