import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Configuration
const RATE_LIMIT = process.env.NODE_ENV === 'development' 
  ? 100 // More lenient in development
  : process.env.RATE_LIMIT ? parseInt(process.env.RATE_LIMIT) : 5 // requests per minute

const WINDOW_MS = process.env.NODE_ENV === 'development'
  ? 10 * 1000 // 10 seconds in development
  : process.env.RATE_LIMIT_WINDOW ? parseInt(process.env.RATE_LIMIT_WINDOW) : 60 * 1000 // 1 minute

// In-memory store for rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export async function rateLimit(req: NextRequest) {
  const ip = req.ip || 'unknown'
  const now = Date.now()

  // Get or initialize rate limit data
  const rateLimitData = rateLimitStore.get(ip) || { count: 0, resetTime: now + WINDOW_MS }

  // Reset if window has passed
  if (now > rateLimitData.resetTime) {
    rateLimitData.count = 0
    rateLimitData.resetTime = now + WINDOW_MS
  }

  // Increment count
  rateLimitData.count++
  rateLimitStore.set(ip, rateLimitData)

  // Check if limit exceeded
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