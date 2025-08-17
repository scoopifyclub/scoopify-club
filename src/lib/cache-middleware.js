// Caching middleware for API responses
import { cache, CACHE_KEYS, CACHE_TTL } from './redis.js';

/**
 * Cache middleware for API routes
 * Automatically caches responses and serves cached data when available
 */
export function withCache(handler, options = {}) {
  const {
    key = null,
    ttl = CACHE_TTL.MEDIUM,
    condition = () => true, // Function to determine if response should be cached
    invalidateOn = [] // Array of cache keys to invalidate after successful request
  } = options;

  // Helper function for conditional logging
  const log = (message, data = null) => {
      if (process.env.NODE_ENV === 'development' || process.env.DEBUG_CACHE === 'true') {
          if (data) {
              console.log(`💾 CACHE: ${message}`, data);
          } else {
              console.log(`💾 CACHE: ${message}`);
          }
      }
  };

  return async (req, res) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return handler(req, res);
    }

    // Generate cache key
    const cacheKey = key || generateCacheKey(req);
    
    try {
      // Try to get cached response
      const cachedResponse = await cache.get(cacheKey);
      
      // Check if response is cacheable
      if (cachedResponse) {
        log(`Serving cached response for: ${cacheKey}`);
        return res.status(200).json(cachedResponse);
      }

      // No cache hit, execute handler
      const originalJson = res.json;
      let responseData = null;

      // Intercept the response
      res.json = function(data) {
        responseData = data;
        return originalJson.call(this, data);
      };

      // Execute the original handler
      await handler(req, res);

      // Cache the response if condition is met
      if (responseData && condition(responseData, req)) {
        await cache.set(cacheKey, responseData, ttl);
        log(`💾 Cached response for: ${cacheKey} (TTL: ${ttl}s)`);
      }

      // Invalidate related cache keys
      if (invalidateOn.length > 0) {
        for (const keyToInvalidate of invalidateOn) {
          await cache.del(keyToInvalidate);
        }
      }

    } catch (error) {
      console.error('Cache middleware error:', error.message);
      // Fallback to original handler
      return handler(req, res);
    }
  };
}

/**
 * Generate cache key based on request
 */
function generateCacheKey(req) {
  const { url, method, query, headers } = req;
  const userAgent = headers['user-agent'] || '';
  const authHeader = headers.authorization ? 'auth' : 'no-auth';
  
  // Create a hash of the request
  const requestHash = `${method}:${url}:${JSON.stringify(query)}:${authHeader}:${userAgent.substring(0, 50)}`;
  
  return `api:${Buffer.from(requestHash).toString('base64').substring(0, 50)}`;
}

/**
 * Cache invalidation helper
 */
export async function invalidateCache(patterns) {
  try {
    if (Array.isArray(patterns)) {
      for (const pattern of patterns) {
        await cache.del(pattern);
      }
    } else {
      await cache.del(patterns);
    }
    console.log(`🗑️  Invalidated cache for: ${patterns}`);
  } catch (error) {
    console.error('Cache invalidation error:', error.message);
  }
}

/**
 * Cache user-specific data
 */
export async function cacheUserData(userId, data, ttl = CACHE_TTL.MEDIUM) {
  const key = CACHE_KEYS.USER_PROFILE(userId);
  return await cache.set(key, data, ttl);
}

/**
 * Get cached user data
 */
export async function getCachedUserData(userId) {
  const key = CACHE_KEYS.USER_PROFILE(userId);
  return await cache.get(key);
}

/**
 * Cache service data
 */
export async function cacheServiceData(serviceId, data, ttl = CACHE_TTL.MEDIUM) {
  const key = CACHE_KEYS.SERVICE_DETAILS(serviceId);
  return await cache.set(key, data, ttl);
}

/**
 * Get cached service data
 */
export async function getCachedServiceData(serviceId) {
  const key = CACHE_KEYS.SERVICE_DETAILS(serviceId);
  return await cache.get(key);
}

/**
 * Cache statistics
 */
export async function cacheStats(stats, ttl = CACHE_TTL.LONG) {
  const keys = {
    [CACHE_KEYS.USER_COUNT]: stats.userCount,
    [CACHE_KEYS.SERVICE_COUNT]: stats.serviceCount,
    [CACHE_KEYS.PAYMENT_COUNT]: stats.paymentCount
  };
  
  return await cache.mset(keys, ttl);
}

/**
 * Get cached statistics
 */
export async function getCachedStats() {
  const keys = [
    CACHE_KEYS.USER_COUNT,
    CACHE_KEYS.SERVICE_COUNT,
    CACHE_KEYS.PAYMENT_COUNT
  ];
  
  const values = await cache.mget(keys);
  return {
    userCount: values[0],
    serviceCount: values[1],
    paymentCount: values[2]
  };
}

/**
 * Rate limiting with cache
 */
export async function rateLimit(key, limit, window) {
  const current = await cache.incr(key, window);
  
  if (current === 1) {
    // First request, set expiry
    await cache.set(key, 1, window);
  }
  
  return {
    current,
    limit,
    remaining: Math.max(0, limit - current),
    reset: Date.now() + (window * 1000)
  };
}

/**
 * Cache health check
 */
export async function checkCacheHealth() {
  try {
    const stats = await cache.getStats();
    const testKey = 'health:check';
    const testValue = { timestamp: Date.now() };
    
    // Test basic operations
    await cache.set(testKey, testValue, 60);
    const retrieved = await cache.get(testKey);
    await cache.del(testKey);
    
    return {
      status: 'healthy',
      connected: stats?.connected || false,
      operations: {
        set: true,
        get: retrieved?.timestamp === testValue.timestamp,
        del: true
      },
      stats
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      connected: false
    };
  }
} 