import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authenticateUser } from '@/lib/auth-server';
import { AuthRateLimiter } from '@/lib/auth-rate-limit';

// Validation function for login request
function validateLoginData(data) {
    if (!data.email || !data.email.includes('@')) {
        throw new Error('Invalid email format');
    }
    if (!data.password || data.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
    }
    return data;
}

export async function POST(request) {
    try {
        const rateLimiter = new AuthRateLimiter();
        const rateLimitResult = await rateLimiter.isAllowed(request);
        
        if (!rateLimitResult.success) {
            const response = NextResponse.json(
                { error: 'Too many login attempts. Please try again later.' },
                { status: 429 }
            );
            
            // Add rate limit headers to response
            rateLimitResult.headers.forEach((value, key) => {
                response.headers.set(key, value);
            });
            
            return response;
        }

        const data = await request.json();
        validateLoginData(data);

        const { user, token } = await authenticateUser(data.email, data.password);

        // Set the token in an HTTP-only cookie
        const cookieStore = cookies();
        cookieStore.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 // 7 days
        });

        // Return user data without sensitive information
        const { password: _, ...userWithoutPassword } = user;
        
        // Get the callback URL if it exists
        const url = new URL(request.url);
        const callbackUrl = url.searchParams.get('callbackUrl') || '/dashboard';

        const response = NextResponse.json({
            user: userWithoutPassword,
            redirectTo: callbackUrl
        });

        // Add rate limit headers to successful response
        rateLimitResult.headers.forEach((value, key) => {
            response.headers.set(key, value);
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to login' },
            { status: 400 }
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
