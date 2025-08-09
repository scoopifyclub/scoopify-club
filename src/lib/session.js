import { PrismaClient } from '@prisma/client';
import { createUserToken, createRefreshToken, validateUserToken } from './jwt-utils';
import { cookies } from 'next/headers';
const prisma = new PrismaClient();

export async function createSession(userId, email, role) {
  const accessToken = await createUserToken({ id: userId, email, role });
  const refreshToken = await createRefreshToken({ id: userId, email, role });
  
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

export async function verifySession(accessToken) {
  try {
    const payload = await validateUserToken(accessToken);
    if (!payload) {
      return null;
    }
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
    
    return user;
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
}

export async function refreshSession(refreshToken) {
  try {
    const payload = await validateUserToken(refreshToken);
    if (!payload || payload.type !== 'refresh') {
      return null;
    }
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
    
    if (!user) {
      return null;
    }
    
    // Create new tokens
    const newAccessToken = await createUserToken(user);
    const newRefreshToken = await createRefreshToken(user);
    
    // Update refresh token in database
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (error) {
    console.error('Session refresh failed:', error);
    return null;
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
