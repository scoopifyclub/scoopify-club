import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { verify } from 'jsonwebtoken'
import { rateLimiter } from './middleware/rate-limiter'
import { securityHeaders } from './middleware/security-headers'
import { requestValidator } from './middleware/request-validator'
import { errorHandler } from './middleware/error-handler'
import { dbErrorHandler } from './middleware/db-error-handler'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = ['/', '/login', '/signup', '/about', '/contact', '/privacy', '/terms']
  const isPublicPath = publicPaths.includes(pathname)

  // Protected paths
  const isProtectedPath = pathname.startsWith('/dashboard') || 
                         pathname.startsWith('/employee') || 
                         pathname.startsWith('/admin')

  // Redirect authenticated users away from auth pages
  if (token && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect unauthenticated users to login
  if (!token && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Apply rate limiting
  const rateLimitResponse = await rateLimiter(request)
  if (rateLimitResponse) return rateLimitResponse

  // Apply security headers
  const securityResponse = securityHeaders(request)
  if (securityResponse) return securityResponse

  // Apply request validation for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    const validationResponse = await requestValidator(request)
    if (validationResponse) return validationResponse

    // Wrap API routes with database error handler
    return dbErrorHandler(request, async () => {
      return NextResponse.next()
    })
  }

  return NextResponse.next()
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
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 