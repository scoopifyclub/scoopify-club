import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize Redis client only if environment variables are available
let redis = null;
let rateLimiter = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Create a rate limiter instance
    rateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1m'), // 5 requests per minute
      analytics: true,
      prefix: '@scoopify/auth',
    });
  } else {
    console.log('Redis environment variables not found, rate limiting will be disabled');
  }
} catch (error) {
  console.error('Failed to initialize Redis:', error);
  console.log('Rate limiting will be disabled');
}

export class AuthRateLimiter {
  constructor() {
    this.rateLimiter = rateLimiter;
  }

  async isAllowed(request) {
    try {
      // If Redis is not available, allow all requests
      if (!this.rateLimiter) {
        console.log('Rate limiting disabled - Redis not available');
        return {
          success: true,
          headers: new Headers(),
          limit: 0,
          remaining: 0,
          reset: 0
        };
      }

      // Get client IP for rate limiting
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 request.ip || 
                 'unknown';

      // Ensure IP is a string and sanitize it
      const sanitizedIp = String(ip).trim().split(',')[0] || 'unknown';

      // Get the result from rate limiter
      const { success, limit, remaining, reset } = await this.rateLimiter.limit(sanitizedIp);

      // Add rate limit headers to the response
      const headers = new Headers();
      headers.set('X-RateLimit-Limit', limit.toString());
      headers.set('X-RateLimit-Remaining', remaining.toString());
      headers.set('X-RateLimit-Reset', reset.toString());

      return {
        success,
        headers,
        limit,
        remaining,
        reset
      };
    } catch (error) {
      console.error('Rate limit error:', error);
      // If rate limiting fails, allow the request but log the error
      return {
        success: true,
        headers: new Headers(),
        limit: 0,
        remaining: 0,
        reset: 0
      };
    }
  }
}

export async function rateLimit(request) {
  const limiter = new AuthRateLimiter();
  return limiter.isAllowed(request);
} 