import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from "@/lib/prisma";
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { verifyToken, refreshToken } from '@/lib/auth';

// Initialize rate limiter only if Redis is properly configured
let ratelimit = null;
// Flag to track Redis connection failures
let redisConnectionFailed = false;

// Check if Redis URL is configured correctly and no previous connection failure
if (!redisConnectionFailed && process.env.REDIS_URL && process.env.REDIS_TOKEN) {
  try {
    // Only initialize Upstash Redis with HTTPS URLs
    if (process.env.REDIS_URL.startsWith('https://')) {
      const redis = new Redis({
        url: process.env.REDIS_URL,
        token: process.env.REDIS_TOKEN,
      });
      
      ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 m'),
      });
    } else {
      console.log('Local Redis URL detected. Skipping Upstash Redis initialization.');
    }
  } catch (error) {
    console.error('Redis initialization error:', error);
    redisConnectionFailed = true;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting only if configured and not previously failed
    if (ratelimit && !redisConnectionFailed) {
      try {
        const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
        const { success } = await ratelimit.limit(ip);
        if (!success) {
          return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }
      } catch (error) {
        // Log error but continue processing the request
        console.error('Rate limiting error:', error);
        // Mark as failed to prevent future attempts
        redisConnectionFailed = true;
        // Don't return - let the request proceed without rate limiting
      }
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    const refreshTokenCookie = cookieStore.get('refreshToken')?.value;
    const fingerprint = cookieStore.get('deviceFingerprint')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token' }, { status: 401 });
    }

    // First try to verify the access token
    const payload = await verifyToken(accessToken);
    
    if (payload) {
      // Access token is still valid
      return NextResponse.json({
        user: {
          id: payload.id,
          email: payload.email,
          role: payload.role,
          customerId: payload.customerId,
          employeeId: payload.employeeId,
        }
      });
    }

    // Access token is invalid, try to refresh if we have a refresh token
    if (!refreshTokenCookie) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }

    // Attempt to refresh the tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken, user: refreshedUser } = await refreshToken(
      refreshTokenCookie,
      fingerprint
    );

    // Create response with new tokens
    const response = NextResponse.json({
      user: {
        id: refreshedUser.id,
        email: refreshedUser.email,
        role: refreshedUser.role,
        customerId: refreshedUser.customerId,
        employeeId: refreshedUser.employeeId,
      }
    });

    // Set new cookies
    response.cookies.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    );
  }
} 