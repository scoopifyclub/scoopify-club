import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Rate limit configurations for different auth actions
const RATE_LIMITS = {
    login: {
        points: 5,  // 5 attempts
        window: 5 * 60 * 1000,  // 5 minutes
        blockDuration: 15 * 60 * 1000  // 15 minutes block after exceeding
    },
    refresh: {
        points: 30,  // 30 attempts
        window: 5 * 60 * 1000,  // 5 minutes
        blockDuration: 5 * 60 * 1000  // 5 minutes block
    },
    signup: {
        points: 3,  // 3 attempts
        window: 60 * 60 * 1000,  // 1 hour
        blockDuration: 24 * 60 * 60 * 1000  // 24 hours block
    },
    forgotPassword: {
        points: 3,  // 3 attempts
        window: 60 * 60 * 1000,  // 1 hour
        blockDuration: 24 * 60 * 60 * 1000  // 24 hours block
    },
    default: {
        points: 10,  // 10 attempts
        window: 5 * 60 * 1000,  // 5 minutes
        blockDuration: 5 * 60 * 1000  // 5 minutes block
    }
};

export class AuthRateLimiter {
    constructor(action = 'default') {
        const config = RATE_LIMITS[action] || RATE_LIMITS.default;
        this.points = config.points;
        this.window = config.window;
        this.blockDuration = config.blockDuration;
    }

    async limit(identifier, context = '') {
        const now = Date.now();
        const key = `auth-rate-limit:${identifier}:${context}`;

        try {
            // Check if currently blocked
            const blocked = await this.isBlocked(key);
            if (blocked) {
                const { retryAfter, remaining } = blocked;
                return this.createLimitExceededResponse(retryAfter, remaining);
            }

            // Get or create rate limit record
            const rateLimit = await prisma.rateLimit.upsert({
                where: { key },
                create: {
                    key,
                    count: 1,
                    resetTime: new Date(now + this.window)
                },
                update: {
                    count: {
                        increment: 1
                    }
                }
            });

            // Check if window has expired and reset if needed
            if (now > rateLimit.resetTime.getTime()) {
                await prisma.rateLimit.update({
                    where: { key },
                    data: {
                        count: 1,
                        resetTime: new Date(now + this.window)
                    }
                });
                return null;
            }

            // Check if limit exceeded
            if (rateLimit.count > this.points) {
                // Set blocked status
                await prisma.rateLimit.update({
                    where: { key },
                    data: {
                        resetTime: new Date(now + this.blockDuration)
                    }
                });

                return this.createLimitExceededResponse(
                    Math.ceil(this.blockDuration / 1000),
                    0
                );
            }

            // Return remaining points
            return {
                headers: {
                    'X-RateLimit-Limit': this.points.toString(),
                    'X-RateLimit-Remaining': (this.points - rateLimit.count).toString(),
                    'X-RateLimit-Reset': Math.ceil((rateLimit.resetTime.getTime() - now) / 1000).toString()
                }
            };
        } catch (error) {
            console.error('Auth rate limit error:', error);
            // Fail open in case of database errors in production
            return null;
        }
    }

    private async isBlocked(key) {
        const record = await prisma.rateLimit.findUnique({
            where: { key }
        });

        if (!record) return null;

        const now = Date.now();
        const resetTime = record.resetTime.getTime();

        if (now < resetTime && record.count > this.points) {
            return {
                retryAfter: Math.ceil((resetTime - now) / 1000),
                remaining: 0
            };
        }

        return null;
    }

    private createLimitExceededResponse(retryAfter, remaining) {
        return {
            response: NextResponse.json({
                error: 'Too many requests',
                retryAfter
            }, {
                status: 429,
                headers: {
                    'Retry-After': retryAfter.toString(),
                    'X-RateLimit-Limit': this.points.toString(),
                    'X-RateLimit-Remaining': remaining.toString(),
                    'X-RateLimit-Reset': retryAfter.toString()
                }
            })
        };
    }
} 