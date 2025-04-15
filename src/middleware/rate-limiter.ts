import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory store for rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = {
  WINDOW_MS: 60 * 1000, // 1 minute
  MAX_REQUESTS: 100, // 100 requests per minute
};

export async function rateLimiter(
  request: NextRequest
): Promise<NextResponse | null> {
  const ip = request.ip || 'unknown';
  const now = Date.now();

  // Get or initialize rate limit data for this IP
  const rateLimitData = rateLimitStore.get(ip) || {
    count: 0,
    resetTime: now + RATE_LIMIT.WINDOW_MS,
  };

  // Reset if window has passed
  if (now > rateLimitData.resetTime) {
    rateLimitData.count = 0;
    rateLimitData.resetTime = now + RATE_LIMIT.WINDOW_MS;
  }

  // Check if rate limit exceeded
  if (rateLimitData.count >= RATE_LIMIT.MAX_REQUESTS) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((rateLimitData.resetTime - now) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitData.resetTime - now) / 1000).toString(),
        },
      }
    );
  }

  // Increment request count
  rateLimitData.count++;
  rateLimitStore.set(ip, rateLimitData);

  return null;
} 