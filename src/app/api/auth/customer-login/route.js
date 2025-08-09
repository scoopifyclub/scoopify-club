var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import prisma from "@/lib/prisma";
import { verifyToken, generateTokens } from '@/lib/api-auth';
export async function POST(request) {
    try {
        console.log('Starting customer login process...');
        const { email, password } = await request.json();
        console.log('Received login request for email:', email);
        if (!email || !password) {
            console.log('Missing email or password');
            return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
        }
        console.log('Finding user in database...');
        // Find the user in the User table
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                customer: true
            }
        });
        console.log('Database query result:', user ? 'User found' : 'User not found');
        if (!user) {
            console.log('User not found in database');
            return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
        }
        // Verify this is a customer account
        if (user.role !== 'CUSTOMER') {
            console.log('User is not a customer, role:', user.role);
            return NextResponse.json({ message: 'This account is not authorized for customer access' }, { status: 403 });
        }
        // Verify customer record exists
        if (!user.customer) {
            console.log('No customer record not found');
            return NextResponse.json({ message: 'Customer record not found' }, { status: 404 });
        }
        console.log('Verifying password...');
        // Verify password
        const isValid = await compare(password, user.password);
        console.log('Password verification result:', isValid);
        if (!isValid) {
            console.log('Invalid password');
            return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
        }
        console.log('Generating JWT tokens...');
        // Generate tokens using the shared function
        const { accessToken, refreshToken } = await generateTokens(user);
        console.log('Login successful, returning response');
        // Return user data and token
        const { password: _ } = user, userWithoutPassword = __rest(user
        // Create response with user data
        , ["password"]);
        // Create response with user data
        const response = NextResponse.json({
            user: userWithoutPassword,
            accessToken: accessToken,
            refreshToken: refreshToken
        });
        // Set cookies with consistent settings
        response.cookies.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });
        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });
        // Set device fingerprint cookie if we have one
        if (user.deviceFingerprint) {
            response.cookies.set('fingerprint', user.deviceFingerprint, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 7 * 24 * 60 * 60, // 7 days
            });
        }
        // Also set non-httpOnly cookies for client JS access
        response.headers.append('Set-Cookie', `accessToken_client=${accessToken}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`);
        response.headers.append('Set-Cookie', `refreshToken_client=${refreshToken}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`);
        return response;
    }
    catch (error) {
        console.error('Login error details:', error);
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        return NextResponse.json({ message: 'An error occurred during login', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
