import { NextResponse } from 'next/server';
import { verifyToken, refreshToken } from '@/lib/api-auth';
import { AuthRateLimiter } from '@/lib/auth-rate-limit';

export async function POST(request) {
    try {
        // Get client IP for rate limiting
        const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
        
        // Apply rate limiting
        const rateLimiter = new AuthRateLimiter('refresh');
        const rateLimitResult = await rateLimiter.limit(ip);
        
        if (rateLimitResult?.blocked) {
            return NextResponse.json(
                { error: 'Too many refresh attempts. Please try again later.' },
                { 
                    status: 429,
                    headers: rateLimitResult.headers
                }
            );
        }

        // Get refresh token from cookies
        const oldRefreshToken = request.cookies.get('refreshToken')?.value;
        const fingerprint = request.cookies.get('fingerprint')?.value;

        if (!oldRefreshToken) {
            return NextResponse.json(
                { error: 'No refresh token provided' },
                { status: 401 }
            );
        }

        // Attempt to refresh the tokens
        const { accessToken, refreshToken: newRefreshToken, user } = await refreshToken(
            oldRefreshToken,
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
                    name: user.name,
                    customerId: user.customer?.id,
                    employeeId: user.employee?.id
                }
            },
            { status: 200 }
        );

        // Set new auth cookies
        response.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60 // 15 minutes
        });

        response.cookies.set('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
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
        console.error('Token refresh error:', error);

        // Handle specific errors
        if (error.message === 'Invalid refresh token' || 
            error.message === 'Refresh token not found or revoked') {
            return NextResponse.json(
                { error: 'Invalid refresh token' },
                { status: 401 }
            );
        }

        if (error.message === 'User not found') {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 401 }
            );
        }

        if (error.message === 'Rate limit exceeded') {
            return NextResponse.json(
                { error: 'Too many refresh attempts. Please try again later.' },
                { status: 429 }
            );
        }

        // Handle any other errors without exposing details
        return NextResponse.json(
            { error: 'An error occurred while refreshing token' },
            { status: 500 }
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
