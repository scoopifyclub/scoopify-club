import { SignJWT, jwtVerify } from 'jose';
import { compare } from 'bcryptjs';
import { cookies } from 'next/headers';
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
// Generate a device fingerprint using Web Crypto API
async function generateFingerprint() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
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
    try {
        console.log(`Generating tokens for user:`, { id: user.id, role: user.role, fingerprint: deviceFingerprint.substring(0, 8) + '...' });

        // Generate access token
        const accessToken = await new SignJWT({
            id: user.id,
            email: user.email,
            role: user.role,
            customerId: user.customer?.id,
            employeeId: user.employee?.id,
            fingerprint: deviceFingerprint,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('15m') // 15 minutes
            .sign(new TextEncoder().encode(JWT_SECRET));

        // Generate refresh token with a unique identifier
        const refreshTokenId = await generateUniqueTokenId();
        const refreshToken = await new SignJWT({
            id: user.id,
            tokenId: refreshTokenId,
            fingerprint: deviceFingerprint,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d')
            .sign(new TextEncoder().encode(REFRESH_SECRET));

        // Store refresh token in database with schema version awareness
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        try {
            // Try with deviceFingerprint
            await prisma.refreshToken.create({
                data: {
                    id: refreshTokenId,
                    token: refreshToken,
                    userId: user.id,
                    deviceFingerprint,
                    expiresAt,
                    updatedAt: new Date()
                },
            });
        } catch (error) {
            if (error.message.includes('Unknown argument `deviceFingerprint`')) {
                // Fall back to schema without deviceFingerprint
                console.warn('Falling back to schema without deviceFingerprint');
                await prisma.refreshToken.create({
                    data: {
                        id: refreshTokenId,
                        token: refreshToken,
                        userId: user.id,
                        expiresAt,
                        updatedAt: new Date()
                    },
                });
            } else {
                throw error;
            }
        }

        // Cleanup old tokens for this user/device combination
        await cleanupOldTokens(user.id, deviceFingerprint);

        console.log('Tokens generated successfully');
        return { accessToken, refreshToken };
    } catch (error) {
        console.error('Error generating tokens:', error);
        throw error;
    }
}

async function generateUniqueTokenId() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const id = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    const exists = await prisma.refreshToken.findUnique({ where: { id } });
    if (exists) return generateUniqueTokenId();
    return id;
}

async function cleanupOldTokens(userId, deviceFingerprint) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    try {
        // Revoke expired tokens - with deviceFingerprint
        await prisma.refreshToken.updateMany({
            where: {
                userId,
                deviceFingerprint,
                expiresAt: { lt: new Date() },
                isRevoked: false
            },
            data: { isRevoked: true }
        });

        // Delete very old tokens - with deviceFingerprint
        await prisma.refreshToken.deleteMany({
            where: {
                userId,
                deviceFingerprint,
                createdAt: { lt: thirtyDaysAgo }
            }
        });
    } catch (error) {
        if (error.message.includes('Unknown argument `deviceFingerprint`')) {
            // Fall back to schema without deviceFingerprint
            console.warn('Falling back to schema without deviceFingerprint in cleanup');
            
            // Revoke expired tokens - without deviceFingerprint
            await prisma.refreshToken.updateMany({
                where: {
                    userId,
                    expiresAt: { lt: new Date() },
                    isRevoked: false
                },
                data: { isRevoked: true }
            });

            // Delete very old tokens - without deviceFingerprint
            await prisma.refreshToken.deleteMany({
                where: {
                    userId,
                    createdAt: { lt: thirtyDaysAgo }
                }
            });
        } else {
            throw error;
        }
    }
}

export async function login(email, password, fingerprint) {
    console.log('Login attempt for email:', email);
    // Find user in database
    const user = await prisma.user.findUnique({
        where: { email }
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
    const deviceFingerprint = fingerprint || await generateFingerprint();
    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user, deviceFingerprint);
    console.log('Generated tokens for user:', { id: user.id, tokenPayload: await verifyToken(accessToken) });
    return { accessToken, refreshToken, user, deviceFingerprint };
}
// Safe to use in Edge environment
export async function verifyToken(token) {
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret, {
            algorithms: ['HS256'],
            clockTolerance: 15 // 15 seconds clock skew tolerance
        });

        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp <= now) {
            return null;
        }

        return payload;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}
export async function refreshToken(oldRefreshToken, fingerprint) {
    try {
        // Verify the old refresh token
        const { payload } = await jwtVerify(
            oldRefreshToken,
            new TextEncoder().encode(REFRESH_SECRET),
            { algorithms: ['HS256'] }
        );

        if (!payload || !payload.id || !payload.tokenId) {
            throw new Error('Invalid refresh token');
        }

        // Try finding the token with deviceFingerprint first
        let storedToken;
        try {
            storedToken = await prisma.refreshToken.findFirst({
                where: {
                    id: payload.tokenId,
                    userId: payload.id,
                    token: oldRefreshToken,
                    isRevoked: false,
                    expiresAt: { gt: new Date() }
                }
            });
        } catch (error) {
            console.error('Error finding refresh token:', error);
            throw new Error('Failed to validate refresh token');
        }

        if (!storedToken) {
            throw new Error('Refresh token not found or revoked');
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

        // Verify fingerprint if provided and if token has deviceFingerprint
        if (fingerprint && storedToken.deviceFingerprint && 
            storedToken.deviceFingerprint !== fingerprint) {
            console.warn('Fingerprint mismatch during token refresh:', {
                tokenFingerprintStart: storedToken.deviceFingerprint?.substring(0, 10) || 'none',
                providedFingerprintStart: fingerprint.substring(0, 10),
                userId: user.id
            });
        }

        // Revoke the old refresh token
        try {
            await prisma.refreshToken.update({
                where: { id: storedToken.id },
                data: { isRevoked: true }
            });
        } catch (error) {
            console.error('Error revoking refresh token:', error);
        }

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
            user,
            fingerprint || storedToken.deviceFingerprint || await generateFingerprint()
        );

        return { accessToken, refreshToken: newRefreshToken, user };
    } catch (error) {
        console.error('Refresh token error:', error);
        throw new Error('Invalid refresh token');
    }
}
export async function validateToken(request) {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) return null;
    
    const payload = await verifyToken(token);
    if (!payload) return null;
    
    return payload;
}
export async function requireAuth(request) {
    const payload = await validateToken(request);
    if (!payload) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    return payload;
}
export async function requireRole(request, role) {
    const payload = await validateToken(request);
    if (!payload) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    if (payload.role !== role) {
        return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }
    return payload;
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

export async function revokeAllUserTokens(userId) {
    try {
        await prisma.refreshToken.updateMany({
            where: {
                userId,
                isRevoked: false
            },
            data: { isRevoked: true }
        });
    } catch (error) {
        console.error('Error revoking user tokens:', error);
        throw error;
    }
}

export async function revokeUserTokenByFingerprint(userId, fingerprint) {
    try {
        await prisma.refreshToken.updateMany({
            where: {
                userId,
                deviceFingerprint: fingerprint,
                isRevoked: false
            },
            data: { isRevoked: true }
        });
    } catch (error) {
        console.error('Error revoking user token by fingerprint:', error);
        throw error;
    }
}

export async function validateUser(token, requiredRole) {
    try {
        const payload = await verifyToken(token);
        if (!payload) {
            throw new Error('Invalid token');
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.id }
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (requiredRole === 'CUSTOMER' && !user.customer) {
            throw new Error('Customer record not found');
        }

        if (requiredRole === 'EMPLOYEE' && !user.employee) {
            throw new Error('Employee record not found');
        }

        if (requiredRole && user.role !== 'ADMIN' && user.role !== requiredRole) {
            throw new Error('Insufficient permissions');
        }

        return {
            userId: user.id,
            role: user.role,
            customerId: user.customer?.id,
            employeeId: user.employee?.id,
            customer: user.customer,
            employee: user.employee
        };
    } catch (error) {
        throw error;
    }
}

export async function verifyAuth(request) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('accessToken')?.value;
        const refreshToken = cookieStore.get('refreshToken')?.value;
        const fingerprint = cookieStore.get('fingerprint')?.value;

        if (!accessToken && !refreshToken) {
            return { success: false, error: 'No session found' };
        }

        if (accessToken) {
            const payload = await verifyToken(accessToken);
            if (payload) {
                const user = await prisma.user.findUnique({
                    where: { id: payload.id },
                    include: {
                        customer: true,
                        employee: true
                    }
                });

                if (user) {
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

        if (refreshToken) {
            try {
                const { accessToken: newAccessToken, user } = await refreshToken(refreshToken, fingerprint);
                
                const response = new NextResponse();
                response.cookies.set('accessToken', newAccessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    path: '/',
                    maxAge: 15 * 60,
                });

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
            } catch (error) {
                return { success: false, error: 'Invalid refresh token' };
            }
        }

        return { success: false, error: 'Invalid session' };
    } catch (error) {
        return { success: false, error: 'Internal server error' };
    }
}
