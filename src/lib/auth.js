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
import { SignJWT, jwtVerify } from 'jose';
import { compare } from 'bcryptjs';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// Ensure these environment variables are set, provide fallbacks for development
const isDev = process.env.NODE_ENV === 'development';
const JWT_SECRET = process.env.JWT_SECRET || (isDev ? '2e2806763fd26af77b3b0fb484b7f631d404f4db4d6c960188069250adbb87d26a0a137349eb77aa1966390f159e20612ab09715b71c0dbb9bc3f3a298c05a44' : undefined);
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (isDev ? '106ab6fa744d76903362930103c6a69ce52d5e8414aac11982225ebb6f270fb00d1622c5eaee66320a7a486f05a2736946ffb880bf187b2b0c6581121790630c' : undefined);
// Log current environment and secrets availability for debugging (not the actual secrets)
console.log(`Auth setup: Environment=${process.env.NODE_ENV}, JWT_SECRET=${JWT_SECRET ? 'set' : 'missing'}, REFRESH_SECRET=${REFRESH_SECRET ? 'set' : 'missing'}`);
if (!JWT_SECRET || !REFRESH_SECRET) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables');
}
// Generate a device fingerprint
function generateFingerprint() {
    return randomBytes(32).toString('hex');
}
// Generate admin token specifically for admin authentication
export async function generateAdminToken(user) {
    if (user.role !== 'ADMIN') {
        throw new Error('Only admin users can generate admin tokens');
    }
    // Generate admin token
    const adminToken = await new SignJWT({
        id: user.id,
        email: user.email,
        role: user.role,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1d') // 1 day
        .sign(new TextEncoder().encode(JWT_SECRET));
    return adminToken;
}
// Set admin cookie in response
export function setAdminCookie(response, token) {
    response.cookies.set('adminToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 // 24 hours
    });
    return response;
}
export async function generateTokens(user, deviceFingerprint) {
    var _a, _b;
    try {
        console.log(`Generating tokens for user:`, { id: user.id, role: user.role, fingerprint: deviceFingerprint.substring(0, 8) + '...' });
        // Generate access token
        const accessToken = await new SignJWT({
            id: user.id,
            email: user.email,
            role: user.role,
            customerId: (_a = user.customer) === null || _a === void 0 ? void 0 : _a.id,
            employeeId: (_b = user.employee) === null || _b === void 0 ? void 0 : _b.id,
            fingerprint: deviceFingerprint,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('15m') // 15 minutes
            .sign(new TextEncoder().encode(JWT_SECRET));
        // Generate refresh token
        const refreshToken = await new SignJWT({
            id: user.id,
            fingerprint: deviceFingerprint,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d')
            .sign(new TextEncoder().encode(REFRESH_SECRET));
        console.log('Tokens generated successfully');
        return { accessToken, refreshToken };
    }
    catch (error) {
        console.error('Error generating tokens:', error);
        throw error;
    }
}
export async function login(email, password, fingerprint) {
    console.log('Login attempt for email:', email);
    // Find user in database
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            customer: true,
            employee: true
        }
    });
    if (!user) {
        throw new Error('Invalid email or password');
    }
    console.log('Found user during login:', { id: user.id, email: user.email, role: user.role });
    // Compare password
    const isValid = await compare(password, user.password);
    if (!isValid) {
        throw new Error('Invalid email or password');
    }
    // Generate device fingerprint if not provided
    const deviceFingerprint = fingerprint || generateFingerprint();
    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user, deviceFingerprint);
    console.log('Generated tokens for user:', { id: user.id, tokenPayload: await verifyToken(accessToken) });
    return { accessToken, refreshToken, user, deviceFingerprint };
}
// Safe to use in Edge environment
export async function verifyToken(token) {
    if (!token)
        return null;
    try {
        // Use TextEncoder for compatibility with all environments
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
        return payload;
    }
    catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}
export async function refreshToken(oldRefreshToken, fingerprint) {
    try {
        const { payload } = await jwtVerify(oldRefreshToken, new TextEncoder().encode(REFRESH_SECRET), { algorithms: ['HS256'] });
        if (!payload || !payload.id) {
            throw new Error('Invalid refresh token');
        }
        // Find user in database
        const user = await prisma.user.findUnique({
            where: { id: payload.id },
            include: {
                customer: true,
                employee: true
            }
        });
        if (!user) {
            throw new Error('User not found');
        }
        // Improved fingerprint handling
        const tokenFingerprint = payload.fingerprint;
        // If both fingerprints exist but don't match, log detailed info but continue
        // This is a security trade-off to prevent login loops while maintaining some security
        if (tokenFingerprint && fingerprint && tokenFingerprint !== fingerprint) {
            console.warn('Fingerprint mismatch during token refresh:', {
                tokenFingerprintStart: tokenFingerprint.substring(0, 10),
                providedFingerprintStart: fingerprint.substring(0, 10),
                userId: user.id
            });
            // Still continue with token refresh using the provided fingerprint
            console.log('Refreshing tokens despite fingerprint mismatch for usability');
        }
        // Generate new tokens with provided fingerprint or the one from the token
        const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user, fingerprint || tokenFingerprint || generateFingerprint());
        return { accessToken, refreshToken: newRefreshToken, user };
    }
    catch (error) {
        console.error('Refresh token error:', error);
        throw new Error('Invalid refresh token');
    }
}
export async function validateUser(token, requiredRole) {
    var _a, _b;
    try {
        console.log('Validating user with token:', token.substring(0, 10) + '...');
        const payload = await verifyToken(token);
        if (!payload) {
            console.log('Token verification failed in validateUser');
            throw new Error('Invalid token');
        }
        console.log('Token payload in validateUser:', payload);
        // Verify user exists and get latest data with relationships
        const user = await prisma.user.findUnique({
            where: { id: payload.id },
            include: {
                customer: {
                    include: {
                        address: true
                    }
                },
                employee: true
            }
        });
        console.log('Found user in validateUser:', user ? { id: user.id, email: user.email, role: user.role } : 'null');
        if (!user) {
            throw new Error('User not found');
        }
        // For customer role, ensure customer record exists
        if (requiredRole === 'CUSTOMER' && !user.customer) {
            throw new Error('Customer record not found');
        }
        // For employee role, ensure employee record exists
        if (requiredRole === 'EMPLOYEE' && !user.employee) {
            throw new Error('Employee record not found');
        }
        // Allow admins to access everything, otherwise check specific role
        if (requiredRole && user.role !== 'ADMIN' && user.role !== requiredRole) {
            throw new Error('Insufficient permissions');
        }
        return {
            userId: user.id,
            role: user.role,
            customerId: (_a = user.customer) === null || _a === void 0 ? void 0 : _a.id,
            employeeId: (_b = user.employee) === null || _b === void 0 ? void 0 : _b.id,
            customer: user.customer,
            employee: user.employee
        };
    }
    catch (error) {
        console.error('Error in validateUser:', error);
        throw error;
    }
}
export async function verifyAuth(request) {
    var _a, _b;
    try {
        // Get tokens from cookies
        const cookieStore = await cookies();
        const accessToken = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        const refreshToken = (_b = cookieStore.get('refreshToken')) === null || _b === void 0 ? void 0 : _b.value;
        if (!accessToken && !refreshToken) {
            return { success: false, error: 'No session found' };
        }
        // Try to verify access token first
        if (accessToken) {
            const payload = await verifyToken(accessToken);
            if (payload) {
                // Find user in database
                const user = await prisma.user.findUnique({
                    where: { id: payload.id },
                    include: {
                        customer: true,
                        employee: true
                    }
                });
                if (user) {
                    const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
                    return {
                        success: true,
                        session: {
                            userId: user.id,
                            email: user.email,
                            name: user.name,
                            role: user.role,
                            customer: user.customer,
                            employee: user.employee,
                        },
                    };
                }
            }
        }
        // If access token is invalid or expired, try refresh token
        if (refreshToken) {
            try {
                const { accessToken: newAccessToken, user } = await refreshToken(refreshToken);
                // Set new access token cookie
                const response = new NextResponse();
                response.cookies.set('accessToken', newAccessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    path: '/',
                    maxAge: 15 * 60, // 15 minutes
                });
                const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
                return {
                    success: true,
                    session: {
                        userId: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        customer: user.customer,
                        employee: user.employee,
                    },
                };
            }
            catch (error) {
                console.error('Refresh token error:', error);
                return { success: false, error: 'Invalid refresh token' };
            }
        }
        return { success: false, error: 'Invalid session' };
    }
    catch (error) {
        console.error('Auth verification error:', error);
        return { success: false, error: 'Internal server error' };
    }
}
// Helper functions for role-based authorization
export async function requireAuth(request) {
    const { success, session, error } = await verifyAuth(request);
    if (!success || !session) {
        throw new Error(error || 'Unauthorized');
    }
    return session;
}
export async function requireRole(request, role) {
    const session = await requireAuth(request);
    if (session.role !== role && session.role !== 'ADMIN') {
        throw new Error('Insufficient permissions');
    }
    return session;
}
// Add authOptions for compatibility with files that expect it
export const authOptions = {
    // This is a compatibility layer to help transition from NextAuth
    // It provides properties that NextAuth's getServerSession would expect
    adapter: null,
    providers: [],
    callbacks: {
        async session({ session, token }) {
            return session;
        },
        async jwt({ token, user }) {
            return token;
        }
    },
    // Custom method to get user from our JWT token
    async getUserFromToken(token) {
        try {
            if (!token)
                return null;
            const payload = await verifyToken(token);
            if (!payload || !payload.id)
                return null;
            const user = await prisma.user.findUnique({
                where: { id: payload.id },
                include: {
                    customer: true,
                    employee: true
                }
            });
            return user;
        }
        catch (error) {
            console.error('Error getting user from token:', error);
            return null;
        }
    }
};
