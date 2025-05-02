import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/api-auth';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        console.log('Admin login request received');
        const { email, password } = await request.json();
        console.log('Login attempt for:', email);
        if (!email || !password) {
            console.log('Missing email or password');
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            console.log('User not found:', email);
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }
        if (user.role !== 'ADMIN') {
            console.log('User is not an admin. Role:', user.role);
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            console.log('Invalid password for user:', email);
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }
        console.log('Admin login successful for:', email);
        const token = await signToken({
            userId: user.id,
            role: user.role,
        });
        const cookieStore = cookies();
        cookieStore.set('accessToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });
        // Create response with user data and token
        const response = NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        }, { status: 200 });
        console.log('Admin login cookies set, returning response');
        return response;
    }
    catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
