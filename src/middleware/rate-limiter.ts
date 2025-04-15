import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
})

// Rate limit configuration
const RATE_LIMIT = {
  window: 60, // 1 minute
  maxRequests: 5, // 5 requests per minute
}

export async function rateLimiter(request: NextRequest) {
  const ip = request.ip || '127.0.0.1'
  const key = `rate-limit:${ip}`

  try {
    const current = await redis.incr(key)
    if (current === 1) {
      await redis.expire(key, RATE_LIMIT.window)
    }

    if (current > RATE_LIMIT.maxRequests) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }
  } catch (error) {
    console.error('Rate limiter error:', error)
  }

  return NextResponse.next()
} 