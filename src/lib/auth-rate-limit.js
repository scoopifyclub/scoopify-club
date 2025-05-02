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

// In-memory rate limit store as a fallback
const inMemoryStore = new Map();

// Cleanup expired in-memory records periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, data] of inMemoryStore.entries()) {
            if (data.resetTime < now) {
                inMemoryStore.delete(key);
            }
        }
    }, 5 * 60 * 1000);
}

export class AuthRateLimiter {
    constructor(action = 'default') {
        const config = RATE_LIMITS[action] || RATE_LIMITS.default;
        this.points = config.points;
        this.window = config.window;
        this.blockDuration = config.blockDuration;
    }

    async limit(identifier, context = '') {
        // Skip rate limiting in development
        if (process.env.NODE_ENV === 'development') {
            return null;
        }
        
        const now = Date.now();
        const key = `auth-rate-limit:${identifier}:${context}`;

        try {
            // First, try to use the database for rate limiting
            return await this._limitWithDatabase(key, now);
        } catch (error) {
            console.error('Database rate limit error:', error);
            
            // If it's a connection issue, use in-memory fallback
            if (error.message && (
                error.message.includes('connection pool') || 
                error.message.includes('failed to connect') ||
                error.message.includes('Connection timed out')
            )) {
                console.log('Using in-memory rate limiting as fallback');
                return this._limitWithMemory(key, now);
            }
            
            // For other errors, fail open
            return null;
        }
    }

    async _limitWithDatabase(key, now) {
        // Check if currently blocked using safe query with timeout handling
        try {
            const blocked = await this._isBlocked(key);
            if (blocked) {
                const { retryAfter, remaining } = blocked;
                return this._createLimitExceededResponse(retryAfter, remaining);
            }
        } catch (error) {
            // If checking for blocked status fails, continue but log it
            console.warn('Block check failed:', error.message);
        }

        try {
            // Get or create rate limit record
            const rateLimit = await prisma.rateLimit.upsert({
                where: { key },
                create: {
                    id: crypto.randomUUID(),
                    key,
                    count: 1,
                    resetTime: new Date(now + this.window),
                    updatedAt: new Date()
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
                // Set blocked status - don't fail if this update fails
                try {
                    await prisma.rateLimit.update({
                        where: { key },
                        data: {
                            resetTime: new Date(now + this.blockDuration)
                        }
                    });
                } catch (updateError) {
                    console.warn('Failed to update block status:', updateError.message);
                }

                return this._createLimitExceededResponse(
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
            throw error; // Let the caller handle this
        }
    }
    
    _limitWithMemory(key, now) {
        // Get or create rate limit data in memory
        let record = inMemoryStore.get(key);
        
        if (!record) {
            record = {
                count: 0,
                resetTime: now + this.window
            };
        }
        
        // Reset if window has expired
        if (now > record.resetTime) {
            record.count = 0;
            record.resetTime = now + this.window;
        }
        
        // Check if blocked
        if (record.count > this.points && now < record.resetTime) {
            const retryAfter = Math.ceil((record.resetTime - now) / 1000);
            inMemoryStore.set(key, record); // Save the record
            return this._createLimitExceededResponse(retryAfter, 0);
        }
        
        // Increment count
        record.count++;
        inMemoryStore.set(key, record);
        
        // Check if limit now exceeded
        if (record.count > this.points) {
            record.resetTime = now + this.blockDuration;
            inMemoryStore.set(key, record);
            return this._createLimitExceededResponse(
                Math.ceil(this.blockDuration / 1000),
                0
            );
        }
        
        // Not blocked
        return {
            headers: {
                'X-RateLimit-Limit': this.points.toString(),
                'X-RateLimit-Remaining': (this.points - record.count).toString(),
                'X-RateLimit-Reset': Math.ceil((record.resetTime - now) / 1000).toString()
            }
        };
    }

    async _isBlocked(key) {
        try {
            const record = await prisma.rateLimit.findUnique({
                where: { key }
            }).catch(err => {
                console.warn('Rate limit check failed:', err.message);
                return null; // If query fails, assume not blocked
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
        } catch (error) {
            console.error('Error checking if blocked:', error);
            return null; // If we can't check, assume not blocked for better UX
        }
    }

    _createLimitExceededResponse(retryAfter, remaining) {
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