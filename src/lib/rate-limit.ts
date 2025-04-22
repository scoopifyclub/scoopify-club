import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Configuration
const RATE_LIMIT = process.env.NODE_ENV === 'development' 
  ? 100 // More lenient in development
  : process.env.RATE_LIMIT ? parseInt(process.env.RATE_LIMIT) : 5 // requests per minute

const WINDOW_MS = process.env.NODE_ENV === 'development'
  ? 10 * 1000 // 10 seconds in development
  : process.env.RATE_LIMIT_WINDOW ? parseInt(process.env.RATE_LIMIT_WINDOW) : 60 * 1000 // 1 minute

// In-memory store for rate limiting that works in Edge Runtime
// Note: This is per-instance memory, so it will reset on deployments
// and won't be shared across multiple instances
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export const rateLimit = {
  async limit(ip: string): Promise<{ success: boolean; limit: number; remaining: number }> {
    const now = Date.now()
    
    // Get or initialize rate limit data
    const rateLimitData = rateLimitMap.get(ip) || { count: 0, resetTime: now + WINDOW_MS }
    
    // Reset if window has passed
    if (now > rateLimitData.resetTime) {
      rateLimitData.count = 0
      rateLimitData.resetTime = now + WINDOW_MS
    }
    
    // Increment count
    rateLimitData.count++
    rateLimitMap.set(ip, rateLimitData)
    
    // Check if limit exceeded
    const success = rateLimitData.count <= RATE_LIMIT
    const remaining = Math.max(0, RATE_LIMIT - rateLimitData.count)
    
    return { 
      success, 
      limit: RATE_LIMIT, 
      remaining 
    }
  },
  
  // Helper to generate a standard rate limit response
  createLimitExceededResponse(retryAfter: number) {
    return NextResponse.json(
      { 
        error: 'Too many requests',
        retryAfter: retryAfter
      },
      { 
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString()
        }
      }
    )
  }
} 