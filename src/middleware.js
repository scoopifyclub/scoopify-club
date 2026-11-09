import { NextResponse } from 'next/server'
import { validateUserToken } from '@/lib/jwt-utils'
import { applySecurityMiddleware } from '@/middleware/security'

// Helper function for conditional logging
const log = (message, data = null) => {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_MIDDLEWARE === 'true') {
        if (data) {
            console.log(`🔒 MIDDLEWARE: ${message}`, data);
        } else {
            console.log(`🔒 MIDDLEWARE: ${message}`);
        }
    }
};

// Admin paths reachable without a session (exact match)
const publicAdminPaths = ['/admin/login', '/api/admin/login']

// True when pathname is `prefix` itself or a sub-path of it. A bare
// startsWith('/admin') would also match '/administrator', and
// startsWith('/') matches everything.
export function matchesPath(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function isAdminPath(pathname) {
  return matchesPath(pathname, '/admin') || matchesPath(pathname, '/api/admin')
}

function denyAdmin(request, status, reason) {
  const { pathname } = request.nextUrl
  log(`Denying ${pathname}: ${reason}`)

  let response
  if (pathname.startsWith('/api/')) {
    response = NextResponse.json(
      { error: status === 401 ? 'Authentication required' : 'Admin access required' },
      { status }
    )
  } else {
    const url = new URL('/admin/login', request.url)
    url.searchParams.set('callbackUrl', pathname)
    response = NextResponse.redirect(url)
  }

  if (status === 401) {
    response.cookies.delete('accessToken')
    response.cookies.delete('token')
  }
  return response
}

// Edge-side gate for /admin and /api/admin. It cannot reach the database, so
// every privileged route handler also calls requireAdmin() (src/lib/admin-auth.js),
// which re-checks the role, the ADMIN_EMAILS allowlist and the session version.
async function gateAdmin(request) {
  const token =
    request.cookies.get('accessToken')?.value ||
    request.cookies.get('token')?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    null

  if (!token) {
    return denyAdmin(request, 401, 'no session')
  }

  const payload = await validateUserToken(token)
  if (!payload) {
    return denyAdmin(request, 401, 'invalid or expired token')
  }
  if (payload.role !== 'ADMIN') {
    return denyAdmin(request, 403, `role ${payload.role}`)
  }
  if (!payload.sv) {
    // Admin token minted before session binding existed
    return denyAdmin(request, 401, 'unbound admin session')
  }

  return nextWithAdminPathname(request)
}

// src/app/admin/layout.jsx skips its server-side check only when this header
// is '/admin/login'. It is overwritten on every /admin request so clients
// cannot spoof it.
function nextWithAdminPathname(request) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-admin-pathname', request.nextUrl.pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Apply security middleware first
  const securityResponse = applySecurityMiddleware(request);
  if (securityResponse.status !== 200) {
    return securityResponse;
  }

  if (isAdminPath(pathname) && !publicAdminPaths.includes(pathname)) {
    return gateAdmin(request)
  }

  if (matchesPath(pathname, '/admin')) {
    return nextWithAdminPathname(request)
  }

  // Customer and scooper pages/APIs enforce auth in their own route handlers
  // and client-side session checks; they are not gated here.
  return NextResponse.next()
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
