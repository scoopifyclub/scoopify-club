import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Configuration
const RATE_LIMIT = process.env.NODE_ENV === 'development' 
  ? 100 // More lenient in development
  : process.env.RATE_LIMIT ? parseInt(process.env.RATE_LIMIT) : 10 // requests per window

const WINDOW_MS = process.env.NODE_ENV === 'development'
  ? 10 * 1000 // 10 seconds in development
  : process.env.RATE_LIMIT_WINDOW ? parseInt(process.env.RATE_LIMIT_WINDOW) : 10 * 1000 // 10 seconds

export const rateLimit = {
  async limit(request: NextRequest) {
    const ip = request.ip ?? '127.0.0.1'
    const key = `rate-limit:${ip}`
    const now = Date.now()
    const resetTime = new Date(now + WINDOW_MS)
    
    try {
      const rateLimit = await prisma.rateLimit.upsert({
        where: { key },
        update: {
          count: {
            increment: 1
          },
          resetTime
        },
        create: {
          key,
          count: 1,
          resetTime
        }
      })
      
      // Check if limit exceeded
      if (rateLimit.count > RATE_LIMIT) {
        const retryAfter = Math.ceil((rateLimit.resetTime.getTime() - now) / 1000)
        return new NextResponse('Too Many Requests', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': retryAfter.toString(),
            'Retry-After': retryAfter.toString()
          }
        })
      }

      return null
    } catch (error) {
      console.error('Rate limit error:', error)
      // Fail open in case of database errors
      return null
    }
  }
} 