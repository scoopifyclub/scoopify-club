import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const RATE_LIMIT = {
  window: 60, // 1 minute
  maxRequests: 60, // 60 requests per minute
}

export async function rateLimiter(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1'
  const key = `rate-limit:${ip}`
  
  try {
    const current = await kv.get<number>(key) ?? 0
    
    if (current >= RATE_LIMIT.maxRequests) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }

    await kv.set(key, current + 1, { ex: RATE_LIMIT.window })

    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', RATE_LIMIT.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', (RATE_LIMIT.maxRequests - current - 1).toString())
    response.headers.set('X-RateLimit-Reset', (Date.now() + RATE_LIMIT.window * 1000).toString())

    return response
  } catch (error) {
    console.error('Rate limiter error:', error)
    return NextResponse.next()
  }
} 