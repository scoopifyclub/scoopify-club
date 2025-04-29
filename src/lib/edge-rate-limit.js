import { NextResponse } from 'next/server';
// Configuration
const RATE_LIMIT = process.env.NODE_ENV === 'development'
    ? 100 // More lenient in development
    : process.env.RATE_LIMIT ? parseInt(process.env.RATE_LIMIT) : 5; // requests per minute
const WINDOW_MS = process.env.NODE_ENV === 'development'
    ? 10 * 1000 // 10 seconds in development
    : process.env.RATE_LIMIT_WINDOW ? parseInt(process.env.RATE_LIMIT_WINDOW) : 60 * 1000; // 1 minute
// In-memory store for rate limiting
const rateLimitStore = new Map();
export const edgeRateLimit = {
    async limit(request) {
        var _a, _b;
        const ip = (_b = (_a = request.ip) !== null && _a !== void 0 ? _a : request.headers.get('x-forwarded-for')) !== null && _b !== void 0 ? _b : '127.0.0.1';
        const key = `rate-limit:${ip}`;
        const now = Date.now();
        // Get or initialize rate limit data
        const rateLimitData = rateLimitStore.get(key) || { count: 0, resetTime: now + WINDOW_MS };
        // Reset if window has passed
        if (now > rateLimitData.resetTime) {
            rateLimitData.count = 0;
            rateLimitData.resetTime = now + WINDOW_MS;
        }
        // Increment count
        rateLimitData.count++;
        rateLimitStore.set(key, rateLimitData);
        // Check if limit exceeded
        if (rateLimitData.count > RATE_LIMIT) {
            const retryAfter = Math.ceil((rateLimitData.resetTime - now) / 1000);
            return this.createLimitExceededResponse(retryAfter);
        }
        return null;
    },
    // Helper to generate a standard rate limit response
    createLimitExceededResponse(retryAfter) {
        return NextResponse.json({
            error: 'Too many requests',
            retryAfter: retryAfter
        }, {
            status: 429,
            headers: {
                'Retry-After': retryAfter.toString()
            }
        });
    }
};
