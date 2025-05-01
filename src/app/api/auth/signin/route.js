import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import prisma from "@/lib/prisma";
import { generateTokens } from '@/lib/auth';
import { z } from 'zod';

const signinSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    deviceFingerprint: z.string().optional()
});

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password, deviceFingerprint } = signinSchema.parse(body);

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Verify password
        const isValidPassword = await compare(password, user.password);
        if (!isValidPassword) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Generate tokens with or without device fingerprint
        const { accessToken, refreshToken } = await generateTokens(
            user, 
            deviceFingerprint || `fallback-${Math.random().toString(36).substring(2)}`
        );

        // Create response with user data
        const response = NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                emailverified: user.emailverified
            }
        });

        // Set cookies with consistent settings
        response.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60, // 15 minutes
        });

        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        // Set device fingerprint cookie if provided
        if (deviceFingerprint) {
            response.cookies.set('fingerprint', deviceFingerprint, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 7 * 24 * 60 * 60, // 7 days
            });
        }

        return response;
    } catch (error) {
        console.error('Signin error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
