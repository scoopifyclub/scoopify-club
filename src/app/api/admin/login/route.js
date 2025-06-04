import { NextResponse } from 'next/server';
import { withAdminDatabase } from "@/lib/prisma";
import bcrypt from 'bcryptjs';
import { signJWT } from '@/lib/auth-server';
import { cookies } from 'next/headers';
import { AuthRateLimiter } from '@/lib/auth-rate-limit';

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
        
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Use database helper for authentication
        const user = await withAdminDatabase(async (prisma) => {
            console.log('🔐 Admin authentication attempt for:', email);
            
            const user = await prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    password: true,
                    role: true,
                    name: true
                }
            });

            if (!user || user.role !== 'ADMIN') {
                console.log('❌ Admin user not found or invalid role');
                return null;
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                console.log('❌ Invalid password for admin user');
                return null;
            }

            console.log('✅ Admin authentication successful');
            return user;
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Generate JWT token
        const token = await signJWT({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        // Create response first
        const response = NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name
            },
            redirectTo: '/admin/dashboard'
        });

        // Set cookies with consistent settings
        response.cookies.set('accessToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60 // 15 minutes
        });

        response.cookies.set('refreshToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 // 7 days
        });

        // Also set non-httpOnly cookies for client JS access
        response.headers.append('Set-Cookie', `accessToken_client=${token}; Path=/; Max-Age=${15 * 60}; SameSite=Lax`);
        response.headers.append('Set-Cookie', `refreshToken_client=${token}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`);

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
