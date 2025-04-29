import { NextResponse } from 'next/server';
import { refreshToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { AuthRateLimiter } from '@/lib/auth-rate-limit';

export async function POST(request) {
    try {
        console.log('Refresh token endpoint called');
        
        // Get client IP for rate limiting
        const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
        
        // Apply rate limiting
        const rateLimiter = new AuthRateLimiter('refresh');
        const rateLimitResult = await rateLimiter.limit(ip, 'refresh');
        
        if (rateLimitResult?.response) {
            return rateLimitResult.response;
        }
        
        const cookieStore = cookies();
        const refreshTokenCookie = cookieStore.get('refreshToken')?.value;
        const fingerprint = cookieStore.get('fingerprint')?.value;

        console.log('Refresh token cookies check:', {
            hasRefreshToken: !!refreshTokenCookie,
            hasFingerprint: !!fingerprint,
            fingerprintStart: fingerprint ? fingerprint.substring(0, 8) : 'null'
        });

        if (!refreshTokenCookie) {
            console.log('No refresh token found in cookies');
            return NextResponse.json(
                { error: 'No refresh token found' },
                { status: 401 }
            );
        }

        // Attempt to refresh the token
        console.log('Attempting to refresh the token');
        const { accessToken, refreshToken: newRefreshToken, user } = await refreshToken(
            refreshTokenCookie,
            fingerprint
        );

        // Create the response with new tokens
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

        // Set the new cookies
        response.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 15 * 60 // 15 minutes
        });

        response.cookies.set('refreshToken', newRefreshToken, {
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
        console.error('Refresh token error:', error);
        
        // Clear cookies on error
        const response = NextResponse.json(
            { error: 'Invalid refresh token' },
            { status: 401 }
        );

        response.cookies.delete('accessToken');
        response.cookies.delete('refreshToken');
        
        return response;
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
