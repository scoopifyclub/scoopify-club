import { Redis } from '@upstash/redis';

// Initialize Redis only if configured
const redis = process.env.REDIS_URL && process.env.REDIS_TOKEN
  ? new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    })
  : null;

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  
  try {
    const data = await redis.get(key);
    return data as T;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  if (!redis) return;
  
  try {
    const { ttl = 3600, tags = [] } = options;
    
    // Store the data
    await redis.set(key, value, {
      ex: ttl,
    });

    // Store tags if provided
    if (tags.length > 0) {
      const tagKeys = tags.map(tag => `tag:${tag}`);
      await Promise.all([
        // Add key to each tag's set
        ...tagKeys.map(tagKey => redis.sadd(tagKey, key)),
        // Set expiration for tag sets
        ...tagKeys.map(tagKey => redis.expire(tagKey, ttl)),
      ]);
    }
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

export async function invalidateCache(tags: string[]): Promise<void> {
  if (!redis) return;
  
  try {
    const tagKeys = tags.map(tag => `tag:${tag}`);
    const keysToDelete = new Set<string>();
    
    // Get all keys associated with the tags
    for (const tagKey of tagKeys) {
      const keys = await redis.smembers(tagKey);
      keys.forEach(key => keysToDelete.add(key));
    }
    
    // Delete all keys and their tag associations
    await Promise.all([
      ...Array.from(keysToDelete).map(key => redis.del(key)),
      ...tagKeys.map(tagKey => redis.del(tagKey)),
    ]);
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

export async function clearCache(): Promise<void> {
  if (!redis) return;
  
  try {
    await redis.flushall();
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  
  return `${prefix}:${sortedParams}`;
} 