import { NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth-server'

// Define paths that don't require authentication
const publicPaths = [
  '/auth/signin',
  '/auth/signup',
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/signout',
  '/login',
  '/admin/login',
  '/',
  '/favicon.ico'
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
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // ADMIN routes: check for accessToken, refreshToken, or general token
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const accessToken = request.cookies.get('accessToken')?.value;
    const refreshToken = request.cookies.get('refreshToken')?.value;
    const generalToken = request.cookies.get('token')?.value;
    
    // If no tokens found, redirect to login
    if (!accessToken && !refreshToken && !generalToken) {
      console.log('No access, refresh, or general token found, redirecting to login');
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    try {
      // Try access token first, then refresh token, then general token
      const token = accessToken || refreshToken || generalToken;
      const payload = await verifyJWT(token);
      
      if (!payload || payload.role !== 'ADMIN') {
        console.log('Invalid token or non-admin role, redirecting to login');
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Add user info to headers for downstream use
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.id);
      requestHeaders.set('x-user-role', payload.role);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.error('Token verification failed:', error);
      // Clear all tokens and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('accessToken');
      response.cookies.delete('refreshToken');
      response.cookies.delete('token');
      return response;
    }
  }

  // All other protected routes: check for any available token
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const generalToken = request.cookies.get('token')?.value;
  const token = accessToken || refreshToken || generalToken;
  
  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  try {
    const payload = await verifyJWT(token);
    
    // Admin routes protection
    if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Employee routes protection
    if (pathname.startsWith('/employee') && payload.role !== 'EMPLOYEE') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Customer routes protection
    if (pathname.startsWith('/customer') && payload.role !== 'CUSTOMER') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Check role restrictions
    for (const [path, roles] of Object.entries(roleRestrictedPaths)) {
      if (pathname.startsWith(path) && !roles.includes(payload.role)) {
        return new NextResponse(null, { status: 403 })
      }
    }

    // Add user info to headers for downstream use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.id)
    requestHeaders.set('x-user-role', payload.role)

    // Apply scheduling validation for service scheduling routes

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    // If token verification fails, clear all tokens and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    response.cookies.delete('token');
    return response;
  }
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