import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verify } from 'jsonwebtoken'
import { rateLimit } from './middleware/rate-limit'
import { securityHeaders } from './middleware/security-headers'
import { dbErrorHandler } from './middleware/db-error-handler'

// Helper function to create a redirect response with security headers
function createRedirectResponse(request: NextRequest, path: string, response: NextResponse) {
  const redirectResponse = NextResponse.redirect(new URL(path, request.url))
  Object.entries(response.headers).forEach(([key, value]) => {
    redirectResponse.headers.set(key, value)
  })
  return redirectResponse
}

// Helper function to get appropriate login path
function getLoginPath(pathname: string) {
  if (pathname.startsWith('/employee')) {
    return '/employee/login'
  } else if (pathname.startsWith('/admin')) {
    return '/admin/login'
  }
  return '/login'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = [
    '/', 
    '/login', 
    '/signup', 
    '/about', 
    '/contact', 
    '/privacy', 
    '/terms', 
    '/employee/login',
    '/admin/login'
  ]
  const isPublicPath = publicPaths.includes(pathname)

  // Protected paths
  const isProtectedPath = pathname.startsWith('/dashboard') || 
                         pathname.startsWith('/employee') || 
                         pathname.startsWith('/admin')

  // Apply rate limiting for all routes
  const rateLimitResponse = await rateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // Get token from cookie
  const token = request.cookies.get('token')?.value

  // Create base response with security headers
  const response = securityHeaders(request)

  if (token) {
    try {
      const decoded = verify(token, process.env.JWT_SECRET!) as { 
        id: string
        email: string
        role: string
      }
      
      // Redirect authenticated users away from auth pages
      if (isPublicPath && pathname !== '/') {
        const redirectPath = decoded.role === 'EMPLOYEE' ? '/employee/dashboard' :
                           decoded.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'
        return createRedirectResponse(request, redirectPath, response)
      }

      // Check role-based access
      if (pathname.startsWith('/employee') && decoded.role !== 'EMPLOYEE') {
        const redirectPath = decoded.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'
        return createRedirectResponse(request, redirectPath, response)
      }

      if (pathname.startsWith('/admin') && decoded.role !== 'ADMIN') {
        const redirectPath = decoded.role === 'EMPLOYEE' ? '/employee/dashboard' : '/dashboard'
        return createRedirectResponse(request, redirectPath, response)
      }

      if (pathname.startsWith('/dashboard') && decoded.role !== 'CUSTOMER') {
        const redirectPath = decoded.role === 'ADMIN' ? '/admin/dashboard' : '/employee/dashboard'
        return createRedirectResponse(request, redirectPath, response)
      }
    } catch (error) {
      // Invalid token, clear it and redirect to appropriate login page
      const loginPath = getLoginPath(pathname)
      const redirectResponse = createRedirectResponse(request, loginPath, response)
      redirectResponse.cookies.delete('token')
      redirectResponse.cookies.delete('userType')
      return redirectResponse
    }
  } else if (isProtectedPath) {
    // No token and trying to access protected path
    const loginPath = getLoginPath(pathname)
    return createRedirectResponse(request, loginPath, response)
  }

  // Wrap API routes with database error handler
  if (request.nextUrl.pathname.startsWith('/api')) {
    return dbErrorHandler(request, async () => {
      return response
    })
  }

  return response
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/admin/:path*',
    '/employee/:path*',
    '/login',
    '/signup',
    '/employee/login',
    '/admin/login',
  ],
}