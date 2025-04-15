import { NextResponse } from 'next/server'

// In-memory store for development
const store = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT = {
  window: 60 * 1000, // 1 minute in milliseconds
  max: 5, // 5 requests per minute
}

export async function rateLimit(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous'
  const key = `rate-limit:${ip}`
  const now = Date.now()

  // Clean up expired entries
  for (const [storedKey, value] of store.entries()) {
    if (now > value.resetTime) {
      store.delete(storedKey)
    }
  }

  // Get or create rate limit entry
  let entry = store.get(key)
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + RATE_LIMIT.window
    }
    store.set(key, entry)
  }

  // Increment count
  entry.count++

  if (entry.count > RATE_LIMIT.max) {
    return NextResponse.json(
      { message: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  return null
} 