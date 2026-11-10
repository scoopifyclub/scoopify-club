import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';
import { createUserToken, createRefreshToken } from '@/lib/jwt-utils';
import { AuthRateLimiter } from '@/lib/auth-rate-limit';
import { isAllowlistedAdminEmail } from '@/lib/admin-auth';
import { setSessionCookies } from '@/lib/auth-cookies';

// Force Node.js runtime for bcryptjs, Prisma, and other Node.js APIs
export const runtime = 'nodejs';

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

        const { email, password } = await request.json();
        
        // Comprehensive email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }
        
        if (!password) {
            return NextResponse.json(
                { error: 'Password is required' },
                { status: 400 }
            );
        }

        console.log('🔐 Admin authentication attempt for:', email);
        
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
                role: true,
                firstName: true,
                lastName: true
            }
        });

        if (!user || user.role !== 'ADMIN' || !isAllowlistedAdminEmail(user.email)) {
            console.log('❌ Admin user not found, invalid role, or not in ADMIN_EMAILS');
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            console.log('❌ Invalid password for admin user');
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        console.log('✅ Admin authentication successful');

        const tokenUser = {
            id: user.id,
            email: user.email,
            role: user.role,
            password: user.password,
        };
        const accessToken = await createUserToken(tokenUser);
        const refreshToken = await createRefreshToken(tokenUser);

        const response = NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: `${user.firstName} ${user.lastName}`
            },
            redirectTo: '/admin/dashboard'
        });

        setSessionCookies(
            response,
            { accessToken, refreshToken },
            { sameSite: 'strict' }
        );

        // Add rate limit headers to successful response
        if (rateLimitResult?.headers) {
            rateLimitResult.headers.forEach((value, key) => {
                response.headers.set(key, value);
            });
        }

        return response;
    } catch (error) {
        console.error('❌ Admin login error:', error);
        
        if (error.code === 'P2024') {
            return NextResponse.json({ 
                error: 'Database connection timeout. Please try again.',
                code: 'CONNECTION_TIMEOUT' 
            }, { status: 503 });
        }
        
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request) {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}
