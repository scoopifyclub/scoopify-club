import { NextResponse } from 'next/server';
import { revokeUserTokenByFingerprint, verifyToken } from '@/lib/api-auth';
import { clearSessionCookies, getRequestAuthToken } from '@/lib/auth-cookies';

export async function POST(request) {
    try {
        console.log('Logout API called');

        const accessToken = await getRequestAuthToken(request);
        const fingerprint = request.cookies.get('fingerprint')?.value;

        const response = NextResponse.json(
            { success: true },
            { status: 200 }
        );

        clearSessionCookies(response);

        if (fingerprint && accessToken) {
            try {
                const payload = await verifyToken(accessToken);
                const userId = payload?.userId || payload?.id;
                if (userId) {
                    await revokeUserTokenByFingerprint(userId, fingerprint);
                }
            } catch (error) {
                console.error('Error revoking refresh token:', error);
            }
        }

        return response;
    } catch (error) {
        console.error('Logout error:', error);

        const response = NextResponse.json(
            { error: 'An error occurred during logout' },
            { status: 500 }
        );
        clearSessionCookies(response);
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
