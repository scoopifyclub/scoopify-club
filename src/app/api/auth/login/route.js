import { NextResponse } from 'next/server';
import { login } from '@/lib/auth';
import { AuthRateLimiter } from '@/lib/auth-rate-limit';
import { z } from 'zod';

// Validation schema for login request
const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    fingerprint: z.string().optional()
});

export async function POST(request) {
    try {
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
        const validatedData = loginSchema.parse(body);

        // Attempt login
        const { accessToken, refreshToken, user, deviceFingerprint } = await login(
            validatedData.email,
            validatedData.password,
            validatedData.fingerprint
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

        // Set auth cookies
        response.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60 // 15 minutes
        });

        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 // 7 days
        });

        response.cookies.set('fingerprint', deviceFingerprint, {
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
        console.error('Login error:', error);
        
        // Handle validation errors
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { 
                    error: 'Invalid input',
                    details: error.errors 
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
