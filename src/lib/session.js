import { PrismaClient } from '@prisma/client';
import { sign, verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
export async function createSession(userId, email, role) {
    const accessToken = sign({ userId, email, role, exp: Math.floor(Date.now() / 1000) + 60 * 60 }, // 1 hour
    JWT_SECRET);
    const refreshToken = sign({ userId, email, role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, // 7 days
    JWT_SECRET);
    // Store refresh token in database
    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });
    return { accessToken, refreshToken };
}
export async function verifySession() {
    var _a, _b;
    const cookieStore = await cookies();
    const accessToken = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
    if (!accessToken) {
        return null;
    }
    try {
        const decoded = verify(accessToken, JWT_SECRET);
        return decoded;
    }
    catch (error) {
        // Try to refresh the token
        const refreshToken = (_b = cookieStore.get('refreshToken')) === null || _b === void 0 ? void 0 : _b.value;
        if (!refreshToken) {
            return null;
        }
        try {
            const decoded = verify(refreshToken, JWT_SECRET);
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await createSession(decoded.userId, decoded.email, decoded.role);
            // Update cookies
            cookieStore.set('accessToken', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60, // 1 hour
            });
            cookieStore.set('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60, // 7 days
            });
            return decoded;
        }
        catch (error) {
            return null;
        }
    }
}
export async function invalidateSession() {
    var _a;
    const cookieStore = await cookies();
    const refreshToken = (_a = cookieStore.get('refreshToken')) === null || _a === void 0 ? void 0 : _a.value;
    if (refreshToken) {
        // Delete refresh token from database
        await prisma.refreshToken.deleteMany({
            where: { token: refreshToken },
        });
    }
    // Clear cookies
    cookieStore.delete('accessToken');
    cookieStore.delete('refreshToken');
}
