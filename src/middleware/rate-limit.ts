import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Redis } from '@upstash/redis'

// Configuration
const RATE_LIMIT = process.env.RATE_LIMIT ? parseInt(process.env.RATE_LIMIT) : 5 // requests per minute
const WINDOW_MS = process.env.RATE_LIMIT_WINDOW ? parseInt(process.env.RATE_LIMIT_WINDOW) : 60 * 1000 // 1 minute

// Initialize Redis if in production
const redis = process.env.NODE_ENV === 'production' 
  ? new Redis({
      url: process.env.REDIS_URL!,
      token: process.env.REDIS_TOKEN!,
    })
  : null

// In-memory store for development
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export async function rateLimit(req: NextRequest) {
  const ip = req.ip || 'unknown'
  const now = Date.now()

  if (process.env.NODE_ENV === 'production' && redis) {
    // Use Redis in production
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
  } else {
    // Use in-memory store in development
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
} 