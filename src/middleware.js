import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Define security headers
export const securityHeaders = {
    'X-DNS-Prefetch-Control': 'on',
    'X-XSS-Protection': '1; mode=block',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
};

// Public paths that don't require authentication
const PUBLIC_PATHS = [
    '/',
    '/about',
    '/contact',
    '/services',
    '/pricing',
    '/auth/signin',
    '/auth/signup',
    '/forgot-password',
    '/reset-password',
    '/terms',
    '/privacy',
    '/faq',
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/refresh'
];

// Rate limiting map (in-memory storage - consider using Redis for production)
const rateLimit = new Map();

// Rate limit check (100 requests per minute)
function checkRateLimit(ip) {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 100;

    const requestLog = rateLimit.get(ip) || [];
    const windowStart = now - windowMs;

    // Filter out old requests
    const recentRequests = requestLog.filter(timestamp => timestamp > windowStart);
    
    if (recentRequests.length >= maxRequests) {
        return false;
    }

    recentRequests.push(now);
    rateLimit.set(ip, recentRequests);
    return true;
}

// Verify token in Edge Runtime
async function verifyToken(token) {
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret, {
            algorithms: ['HS256'],
            clockTolerance: 15 // 15 seconds clock skew tolerance
        });

        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp <= now) {
            return null;
        }

        return payload;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

export async function middleware(request) {
    const path = request.nextUrl.pathname;
    
    // Get client IP
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
        return new NextResponse('Too Many Requests', {
            status: 429,
            headers: {
                'Retry-After': '60',
                ...securityHeaders
            }
        });
    }

    // Allow public paths and static assets
    if (PUBLIC_PATHS.includes(path) || 
        path.startsWith('/_next/') || 
        path.startsWith('/api/auth/') ||
        path.includes('/favicon.ico')) {
        const response = NextResponse.next();
        Object.entries(securityHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
        return response;
    }

    try {
        // Get access token from cookie
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('accessToken')?.value;

        if (!accessToken) {
            // Redirect to login with callback URL
            const url = new URL('/auth/signin', request.url);
            url.searchParams.set('callbackUrl', request.nextUrl.pathname);
            return NextResponse.redirect(url);
        }

        // Verify token
        const payload = await verifyToken(accessToken);
        if (!payload) {
            const url = new URL('/auth/signin', request.url);
            url.searchParams.set('callbackUrl', request.nextUrl.pathname);
            return NextResponse.redirect(url);
        }

        // Handle role-based access
        const roleMatches = {
            '/employee/dashboard': payload.role === 'EMPLOYEE',
            '/admin/dashboard': payload.role === 'ADMIN',
            '/customer/dashboard': payload.role === 'CUSTOMER'
        };

        for (const [prefix, isAllowed] of Object.entries(roleMatches)) {
            if (path.startsWith(prefix) && !isAllowed) {
                return NextResponse.redirect(new URL('/', request.url));
            }
        }

        // Apply security headers and continue
        const response = NextResponse.next();
        Object.entries(securityHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
        return response;

    } catch (error) {
        console.error('Middleware error:', error);
        return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
}

export const config = {
    matcher: [
        '/employee/dashboard/:path*',
        '/admin/dashboard/:path*',
        '/customer/dashboard/:path*',
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
};
