import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Create a rate limiter instance
const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1m'), // 5 requests per minute
  analytics: true,
  prefix: '@scoopify/auth',
});

export class AuthRateLimiter {
  constructor() {
    this.rateLimiter = rateLimiter;
  }

  async isAllowed(request) {
    try {
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