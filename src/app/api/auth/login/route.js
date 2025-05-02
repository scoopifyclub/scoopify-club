import { NextResponse } from 'next/server';
import { login } from '@/lib/auth';
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
        console.log('Login API called');
        
        // Get client IP for rate limiting
        const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
        
        // Apply rate limiting
        const rateLimiter = new AuthRateLimiter('login');
        const rateLimitResult = await rateLimiter.limit(ip);
        
        if (rateLimitResult?.blocked) {
            return NextResponse.json(
                { error: 'Too many login attempts. Please try again later.' },
                { 
                    status: 429,
                    headers: rateLimitResult.headers
                }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validatedData = validateLoginData(body);

        // Attempt login
        const { accessToken, refreshToken, user, deviceFingerprint } = await login(
            validatedData.email,
            validatedData.password,
            validatedData.fingerprint
        );

        // Determine domain for cookies
        const host = request.headers.get('host') || '';
        const hostname = host.split(':')[0]; // Remove port if present
        
        // Get domain for cookies
        let cookieDomain = null;
        
        // Only set specific domain in production for scoopify.club
        if (process.env.NODE_ENV === 'production' && hostname.includes('scoopify.club')) {
            // For production scoopify.club domain, use root domain
            cookieDomain = 'scoopify.club';
        }
        
        console.log(`Setting cookies with domain: ${cookieDomain || '(default)'}`);

        // Create successful response
        const response = NextResponse.json(
            {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    customerId: user.customer?.id,
                    employeeId: user.employee?.id,
                    role: user.role
                }
            },
            { status: 200 }
        );

        // Cookie options
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', // Changed from 'strict' to 'lax' to allow redirects
            path: '/',
        };
        
        // Add domain if we have one
        if (cookieDomain) {
            cookieOptions.domain = cookieDomain;
        }

        // Set refresh token cookie
        response.cookies.set('refreshToken', refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 // 7 days
        });

        // Set access token cookie
        if (user.role === 'ADMIN') {
            response.cookies.set('adminToken', accessToken, {
                ...cookieOptions,
                maxAge: 15 * 60 // 15 minutes
            });
        } else {
            response.cookies.set('token', accessToken, {
                ...cookieOptions,
                maxAge: 15 * 60 // 15 minutes
            });
        }

        response.cookies.set('fingerprint', deviceFingerprint, {
            ...cookieOptions,
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
        
        // Handle validation errors
        if (error instanceof Error) {
            return NextResponse.json(
                { 
                    error: error.message
                },
                { status: 400 }
            );
        }

        // Handle specific auth errors
        if (error.message === 'Invalid email or password') {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Handle rate limit errors
        if (error.message === 'Rate limit exceeded') {
            return NextResponse.json(
                { error: 'Too many login attempts. Please try again later.' },
                { status: 429 }
            );
        }

        // Handle any other errors without exposing details
        return NextResponse.json(
            { error: 'An error occurred during login' },
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
