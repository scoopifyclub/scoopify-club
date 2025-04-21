import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Redis } from '@upstash/redis'

// Configuration
const RATE_LIMIT = process.env.RATE_LIMIT ? parseInt(process.env.RATE_LIMIT) : 5 // requests per minute
const WINDOW_MS = process.env.RATE_LIMIT_WINDOW ? parseInt(process.env.RATE_LIMIT_WINDOW) : 60 * 1000 // 1 minute

// Initialize Redis if in production
let redis = null;

// Only initialize Upstash Redis in production and if URL is in the correct format
if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL && process.env.REDIS_TOKEN) {
  try {
    // Only initialize Upstash Redis with HTTPS URLs
    if (process.env.REDIS_URL.startsWith('https://')) {
      redis = new Redis({
        url: process.env.REDIS_URL,
        token: process.env.REDIS_TOKEN,
      });
      console.log('Redis initialized for rate limiting middleware');
    } else {
      console.log('Local Redis URL detected. Skipping Upstash Redis initialization for rate limiting middleware.');
    }
  } catch (error) {
    console.error('Redis initialization error in rate limit middleware:', error);
    redis = null;
  }
}

// In-memory store for development
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export async function rateLimit(req: NextRequest) {
  const ip = req.ip || 'unknown'
  const now = Date.now()

  if (process.env.NODE_ENV === 'production' && redis) {
    // Use Redis in production
    try {
      const key = `rate-limit:${ip}`
      const current = await redis.get<{ count: number; resetTime: number }>(key)
      
      if (!current || now > current.resetTime) {
        await redis.set(key, { count: 1, resetTime: now + WINDOW_MS })
        return null
      }

      if (current.count >= RATE_LIMIT) {
        return NextResponse.json(
          { 
            error: 'Too many requests',
            retryAfter: Math.ceil((current.resetTime - now) / 1000)
          },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString()
            }
          }
        )
      }

      await redis.set(key, { ...current, count: current.count + 1 })
      return null
    } catch (error) {
      console.error('Redis rate limiting error:', error);
      // Fall back to in-memory rate limiting if Redis fails
      return inMemoryRateLimit(ip, now);
    }
  } else {
    // Use in-memory store in development
    return inMemoryRateLimit(ip, now);
  }
}

// Helper for in-memory rate limiting
function inMemoryRateLimit(ip: string, now: number) {
  const rateLimitData = rateLimitStore.get(ip) || { count: 0, resetTime: now + WINDOW_MS }

  if (now > rateLimitData.resetTime) {
    rateLimitData.count = 0
    rateLimitData.resetTime = now + WINDOW_MS
  }

  rateLimitData.count++
  rateLimitStore.set(ip, rateLimitData)

  if (rateLimitData.count > RATE_LIMIT) {
    return NextResponse.json(
      { 
        error: 'Too many requests',
        retryAfter: Math.ceil((rateLimitData.resetTime - now) / 1000)
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitData.resetTime - now) / 1000).toString()
        }
      }
    )
  }

  return null
} 