import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revokeUserTokenByFingerprint } from '@/lib/auth';

export async function POST(request) {
    try {
        const cookieStore = cookies();
        const refreshToken = cookieStore.get('refreshToken')?.value;
        const fingerprint = cookieStore.get('fingerprint')?.value;
        const userId = cookieStore.get('userId')?.value;

        // If we have the user ID and fingerprint, revoke their tokens
        if (userId && fingerprint) {
            await revokeUserTokenByFingerprint(userId, fingerprint);
        }

        // Create response with cleared cookies
        const response = NextResponse.json(
            { success: true },
            { status: 200 }
        );

        // Clear all auth-related cookies
        response.cookies.delete('accessToken');
        response.cookies.delete('refreshToken');
        response.cookies.delete('fingerprint');
        response.cookies.delete('userId');

        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Failed to logout' },
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
