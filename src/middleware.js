import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Paths that don't require authentication
const PUBLIC_PATHS = [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-email',
    '/pricing',
    '/contact',
    '/about',
    '/terms',
    '/privacy',
    '/faq',
    '/blog',
];

// Paths that start with these prefixes don't require authentication
const PUBLIC_PATH_PREFIXES = [
    '/_next',
    '/api/auth',
    '/api/webhooks',
    '/api/health',
    '/static',
    '/images',
    '/fonts',
];

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // Check if the path is public
    if (PUBLIC_PATHS.includes(pathname) || 
        PUBLIC_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
        return NextResponse.next();
    }

    // Get the token from cookies
    const token = request.cookies.get('token')?.value;

    // If no token is present, redirect to login
    if (!token) {
        const url = new URL('/auth/signin', request.url);
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
    }

    try {
        // Verify the token and get the payload
        const payload = await verifyToken(token);
        
        if (!payload) {
            throw new Error('Invalid token');
        }

        // Check role-based access
        if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 403 });
        }

        if (pathname.startsWith('/employee/dashboard') && payload.role !== 'EMPLOYEE') {
            return new NextResponse('Unauthorized', { status: 403 });
        }

        if (pathname.startsWith('/customer/dashboard') && payload.role !== 'CUSTOMER') {
            return new NextResponse('Unauthorized', { status: 403 });
        }

        // Create the response
        const response = NextResponse.next();

        // Add security headers
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        response.headers.set(
            'Content-Security-Policy',
            "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:;"
        );

        return response;
    } catch (error) {
        console.error('Auth middleware error:', error);

        // If token is invalid, redirect to login
        const url = new URL('/auth/signin', request.url);
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
    }
}

// Configure which paths the middleware should run on
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
};
