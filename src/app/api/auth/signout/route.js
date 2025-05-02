import { NextResponse } from 'next/server';
import { revokeUserTokenByFingerprint, verifyToken } from '@/lib/auth';

export async function POST(request) {
    try {
        console.log('Signout API called');
        
        // Get tokens from cookies - check all possible cookie names
        const token = request.cookies.get('token')?.value;
        const adminToken = request.cookies.get('adminToken')?.value;
        const refreshToken = request.cookies.get('refreshToken')?.value;
        const fingerprint = request.cookies.get('fingerprint')?.value;

        // Determine which token to use for verification (prefer admin token if available)
        const activeToken = adminToken || token;

        // Create response
        const response = NextResponse.json(
            { success: true },
            { status: 200 }
        );

        // Helper function to safely delete cookies
        const safeDeleteCookie = (name) => {
            try {
                response.cookies.delete(name);
                // Also try deleting with root domain to handle subdomain issues
                response.cookies.delete(name, {
                    domain: 'scoopify.club',
                    path: '/'
                });
            } catch (e) {
                console.error(`Error deleting cookie ${name}:`, e);
            }
        };

        // Clear all possible auth cookies
        safeDeleteCookie('token');
        safeDeleteCookie('adminToken');
        safeDeleteCookie('refreshToken');
        safeDeleteCookie('fingerprint');

        // If we have a fingerprint, revoke the refresh token
        if (fingerprint) {
            try {
                // Extract user ID from access token if available
                let userId = null;
                if (activeToken) {
                    const payload = await verifyToken(activeToken);
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
        console.error('Signout error:', error);
        
        // Even if there's an error, try to clear cookies
        const response = NextResponse.json(
            { error: 'An error occurred during signout' },
            { status: 500 }
        );

        // Helper function to safely delete cookies
        const safeDeleteCookie = (name) => {
            try {
                response.cookies.delete(name);
                // Also try deleting with root domain to handle subdomain issues
                response.cookies.delete(name, {
                    domain: 'scoopify.club',
                    path: '/'
                });
            } catch (e) {
                console.error(`Error deleting cookie ${name}:`, e);
            }
        };

        // Clear all possible auth cookies
        safeDeleteCookie('token');
        safeDeleteCookie('adminToken');
        safeDeleteCookie('refreshToken');
        safeDeleteCookie('fingerprint');

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