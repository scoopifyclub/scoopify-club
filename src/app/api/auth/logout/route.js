import { NextResponse } from 'next/server';
import { revokeUserTokenByFingerprint, verifyToken } from '@/lib/auth';

export async function POST(request) {
    try {
        // Get tokens from cookies
        const accessToken = request.cookies.get('accessToken')?.value;
        const refreshToken = request.cookies.get('refreshToken')?.value;
        const fingerprint = request.cookies.get('fingerprint')?.value;

        // Create response
        const response = NextResponse.json(
            { success: true },
            { status: 200 }
        );

        // Clear auth cookies
        response.cookies.delete('accessToken');
        response.cookies.delete('refreshToken');
        response.cookies.delete('fingerprint');

        // If we have a fingerprint, revoke the refresh token
        if (fingerprint) {
            try {
                // Extract user ID from access token if available
                let userId = null;
                if (accessToken) {
                    const payload = await verifyToken(accessToken);
                    if (payload?.id) {
                        userId = payload.id;
                    }
                }

                // If we have both userId and fingerprint, revoke the token
                if (userId) {
                    await revokeUserTokenByFingerprint(userId, fingerprint);
                }
            } catch (error) {
                // Log error but don't fail the logout
                console.error('Error revoking refresh token:', error);
            }
        }

        return response;
    } catch (error) {
        console.error('Logout error:', error);
        
        // Even if there's an error, try to clear cookies
        const response = NextResponse.json(
            { error: 'An error occurred during logout' },
            { status: 500 }
        );

        response.cookies.delete('accessToken');
        response.cookies.delete('refreshToken');
        response.cookies.delete('fingerprint');

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
