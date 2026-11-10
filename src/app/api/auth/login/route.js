import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authenticateUser } from '@/lib/api-auth';
import { AuthRateLimiter } from '@/lib/auth-rate-limit';
import { setSessionCookiesOnStore } from '@/lib/auth-cookies';

// Validation function for login request
function validateLoginData(data) {
    // Comprehensive email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
        throw new Error('Invalid email format');
    }
    
    // Basic password validation for login (less strict than signup)
    if (!data.password || data.password.length < 1) {
        throw new Error('Password is required');
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

        const { user, accessToken, refreshToken } = await authenticateUser(data.email, data.password);

        const cookieStore = await cookies();
        setSessionCookiesOnStore(
            cookieStore,
            { accessToken, refreshToken },
            { sameSite: 'strict' }
        );

        console.log('✅ Login cookies set successfully for user:', user.email, 'role:', user.role);

        // Return user data without sensitive information
        const { password: _, ...userWithoutPassword } = user;
        
        // Get redirect URL based on user role
        let redirectTo = '/dashboard';
        switch(user.role?.toUpperCase()) {
            case 'ADMIN':
                redirectTo = '/admin/dashboard';
                break;
            case 'EMPLOYEE':
                redirectTo = '/employee/dashboard';
                break;
            case 'CUSTOMER':
            default:
                redirectTo = '/dashboard';
                break;
        }

        const response = NextResponse.json({
            user: userWithoutPassword,
            accessToken: accessToken,
            refreshToken: refreshToken,
            redirectTo: redirectTo
        });

        // Add rate limit headers to successful response
        rateLimitResult.headers.forEach((value, key) => {
            response.headers.set(key, value);
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
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
