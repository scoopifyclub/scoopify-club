import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
    try {
        // Add verbose logging for debugging
        console.log('Session check API called');
        
        // Get all cookies for debugging
        const cookieHeader = request.headers.get('cookie') || '';
        const cookies = parseCookies(cookieHeader);
        
        console.log('Cookies received in session check:', 
            Object.keys(cookies).map(name => ({ name, length: cookies[name].length }))
        );
        
        // Check for token in cookies
        const token = cookies.token || cookies.adminToken || null;
        
        if (!token) {
            console.log('No token cookie found in request');
            return NextResponse.json(
                { error: 'No session found' },
                { status: 401 }
            );
        }
        
        console.log('Token found, attempting to verify');
        
        // Verify the token
        try {
            const userData = await verifyToken(token);
            
            if (!userData) {
                console.log('Token verification returned null user data');
                return NextResponse.json(
                    { error: 'Invalid session' },
                    { status: 401 }
                );
            }
            
            console.log('Token verified successfully for user:', userData.email);
            
            // Return user data
            return NextResponse.json({
                authenticated: true,
                user: {
                    id: userData.id,
                    email: userData.email,
                    name: userData.name,
                    role: userData.role,
                    // Include these fields conditionally
                    ...(userData.customerId && { customerId: userData.customerId }),
                    ...(userData.employeeId && { employeeId: userData.employeeId })
                }
            });
        } catch (verifyError) {
            console.error('Token verification error:', verifyError);
            
            // Add more detailed error information for debugging
            const errorDetails = {
                error: 'Session verification failed',
                message: verifyError instanceof Error ? verifyError.message : 'Unknown error',
                tokenPresent: Boolean(token)
            };
            
            // Check if error is JWT expiration
            if (verifyError.message && verifyError.message.includes('expired')) {
                errorDetails.errorCode = 'TOKEN_EXPIRED';
                errorDetails.solution = 'Try refreshing the token';
            }
            
            return NextResponse.json(errorDetails, { status: 401 });
        }
    } catch (error) {
        console.error('Session check error:', error);
        
        return NextResponse.json(
            { 
                error: 'Session check failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Helper function to parse cookies
function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;
    
    cookieHeader.split(';').forEach(cookie => {
        const [name, ...rest] = cookie.split('=');
        if (name) {
            const cookieName = name.trim();
            const cookieValue = rest.join('=').trim();
            if (cookieValue) {
                cookies[cookieName] = cookieValue;
            }
        }
    });
    
    return cookies;
}

// Also handle OPTIONS request for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        },
    });
}
