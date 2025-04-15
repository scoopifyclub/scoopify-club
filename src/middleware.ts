import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verify } from 'jsonwebtoken'
import { rateLimiter } from './middleware/rate-limiter'
import { requestValidator } from './middleware/request-validator'
import { errorHandler } from './middleware/error-handler'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const path = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/']
  if (publicRoutes.includes(path)) {
    return NextResponse.next()
  }

  // If no token is present, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  try {
    // Verify the token
    const decoded = verify(token, process.env.JWT_SECRET!) as {
      id: string
      email: string
      type: 'employee' | 'customer'
    }

    // Check if the user is trying to access employee routes
    if (path.startsWith('/employee') && decoded.type !== 'employee') {
      const dashboardUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(dashboardUrl)
    }

    // Check if the user is trying to access customer routes
    if (path.startsWith('/dashboard') && decoded.type !== 'customer') {
      const employeeDashboardUrl = new URL('/employee/dashboard', request.url)
      return NextResponse.redirect(employeeDashboardUrl)
    }

    // Apply rate limiting
    const rateLimitResponse = await rateLimiter(request)
    if (rateLimitResponse) return rateLimitResponse

    // Apply request validation
    const validationResponse = await requestValidator(request)
    if (validationResponse) return validationResponse

    return NextResponse.next()
  } catch (error) {
    // If token is invalid, redirect to login
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/employee/:path*',
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 