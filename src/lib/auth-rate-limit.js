import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export class AuthRateLimiter {
  constructor() {
    this.ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
      analytics: true,
      prefix: 'auth_ratelimit',
    });
  }

  async isAllowed(request) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { success } = await this.ratelimit.limit(ip);
    return success;
  }
} 