import { NextResponse } from 'next/server';

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map();

export function withRateLimit(handler, options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests, please try again later.',
    statusCode = 429,
    keyGenerator = (req) => req.ip || 'anonymous',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return async (req, res) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (rateLimitStore.has(key)) {
      const requests = rateLimitStore.get(key).filter(timestamp => timestamp > windowStart);
      rateLimitStore.set(key, requests);
    }

    const currentRequests = rateLimitStore.get(key) || [];
    
    if (currentRequests.length >= max) {
      return NextResponse.json({ error: message }, { status: statusCode });
    }

    // Add current request
    currentRequests.push(now);
    rateLimitStore.set(key, currentRequests);

    // Continue with handler
    return await handler(req, res);
  };
}