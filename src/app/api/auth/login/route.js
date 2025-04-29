import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { login } from '@/lib/auth';
import { AuthRateLimiter } from '@/lib/auth-rate-limit';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password, fingerprint } = body;

        // Get client IP for rate limiting
        const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
        
        // Apply rate limiting
        const rateLimiter = new AuthRateLimiter('login');
        const rateLimitResult = await rateLimiter.limit(ip, 'login');
        
        if (rateLimitResult?.response) {
            return rateLimitResult.response;
        }

        // Validate required fields
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Attempt login
        const { accessToken, refreshToken, user, deviceFingerprint } = await login(
            email,
            password,
            fingerprint
        );

        // Create successful response
        const response = NextResponse.json(
            {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    name: user.name
                }
            },
            { status: 200 }
        );

        // Set auth cookies
        response.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 15 * 60 // 15 minutes
        });

        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 // 7 days
        });

        response.cookies.set('fingerprint', deviceFingerprint, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 // 7 days
        });

        // Add rate limit headers if available
        if (rateLimitResult?.headers) {
            Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
                response.headers.set(key, value);
            });
        }

        return response;
    } catch (error) {
        console.error('Login error:', error);
        
        // Don't expose internal errors
        return NextResponse.json(
            { error: 'Invalid email or password' },
            { status: 401 }
        );
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        },
    });
}
