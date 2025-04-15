import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verify } from 'jsonwebtoken'
import { rateLimiter } from './middleware/rate-limiter'
import { securityHeaders } from './middleware/security-headers'
import { requestValidator } from './middleware/request-validator'
import { errorHandler } from './middleware/error-handler'
import { dbErrorHandler } from './middleware/db-error-handler'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = ['/', '/login', '/signup', '/about', '/contact', '/privacy', '/terms', '/employee/login']
  const isPublicPath = publicPaths.includes(pathname)

  // Protected paths
  const isProtectedPath = pathname.startsWith('/dashboard') || 
                         pathname.startsWith('/employee') || 
                         pathname.startsWith('/admin')

  // Apply rate limiting for all routes
  const rateLimitResponse = await rateLimiter(request)
  if (rateLimitResponse.status === 429) {
    return rateLimitResponse
  }

  // Get token from cookie
  const token = request.cookies.get('token')?.value
  const userType = request.cookies.get('userType')?.value

  // Create base response with security headers
  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  if (token) {
    try {
      const decoded = verify(token, process.env.JWT_SECRET!) as { 
        id: string
        email: string
        role: string
      }
      
      // Redirect authenticated users away from auth pages
      if (pathname === '/login' || pathname === '/signup' || pathname === '/employee/login') {
        const redirectUrl = new URL(decoded.role === 'EMPLOYEE' ? '/employee/dashboard' : '/dashboard', request.url)
        const redirectResponse = NextResponse.redirect(redirectUrl)
        // Copy security headers to redirect response
        Object.entries(response.headers).forEach(([key, value]) => {
          redirectResponse.headers.set(key, value)
        })
        return redirectResponse
      }

      // Check role-based access
      if (pathname.startsWith('/employee') && decoded.role !== 'EMPLOYEE') {
        const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url))
        Object.entries(response.headers).forEach(([key, value]) => {
          redirectResponse.headers.set(key, value)
        })
        return redirectResponse
      }

      if (pathname.startsWith('/admin') && decoded.role !== 'ADMIN') {
        const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url))
        Object.entries(response.headers).forEach(([key, value]) => {
          redirectResponse.headers.set(key, value)
        })
        return redirectResponse
      }

      if (pathname.startsWith('/dashboard') && decoded.role !== 'CUSTOMER') {
        const redirectResponse = NextResponse.redirect(new URL('/employee/dashboard', request.url))
        Object.entries(response.headers).forEach(([key, value]) => {
          redirectResponse.headers.set(key, value)
        })
        return redirectResponse
      }
    } catch (error) {
      // Invalid token, clear it and redirect to appropriate login page
      const redirectResponse = NextResponse.redirect(
        new URL(pathname.startsWith('/employee') ? '/employee/login' : '/login', request.url)
      )
      redirectResponse.cookies.delete('token')
      redirectResponse.cookies.delete('userType')
      Object.entries(response.headers).forEach(([key, value]) => {
        redirectResponse.headers.set(key, value)
      })
      return redirectResponse
    }
  } else if (isProtectedPath) {
    // No token and trying to access protected path
    const redirectResponse = NextResponse.redirect(
      new URL(pathname.startsWith('/employee') ? '/employee/login' : '/login', request.url)
    )
    Object.entries(response.headers).forEach(([key, value]) => {
      redirectResponse.headers.set(key, value)
    })
    return redirectResponse
  }

  // Apply request validation for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    const validationResponse = await requestValidator(request)
    if (validationResponse) {
      Object.entries(response.headers).forEach(([key, value]) => {
        validationResponse.headers.set(key, value)
      })
      return validationResponse
    }

    // Wrap API routes with database error handler
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
  ],
}