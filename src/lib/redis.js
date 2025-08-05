// Redis caching service for improved performance
import { createClient } from 'redis';

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return this.client;

    try {
      // Use Upstash Redis URL if available, otherwise local
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('Redis connection failed after 10 retries');
              return false;
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('❌ Redis connection failed:', error.message);
      this.isConnected = false;
      return null;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  // Cache data with TTL
  async set(key, value, ttl = 3600) {
    try {
      const client = await this.connect();
      if (!client) return false;

      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      await client.setEx(key, ttl, serializedValue);
      return true;
    } catch (error) {
      console.error('Redis set error:', error.message);
      return false;
    }
  }

  // Get cached data
  async get(key) {
    try {
      const client = await this.connect();
      if (!client) return null;

      const value = await client.get(key);
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch {
        return value; // Return as string if not JSON
      }
    } catch (error) {
      console.error('Redis get error:', error.message);
      return null;
    }
  }

  // Delete cached data
  async del(key) {
    try {
      const client = await this.connect();
      if (!client) return false;

      await client.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error.message);
      return false;
    }
  }

  // Check if key exists
  async exists(key) {
    try {
      const client = await this.connect();
      if (!client) return false;

      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error.message);
      return false;
    }
  }

  // Set multiple values
  async mset(keyValuePairs, ttl = 3600) {
    try {
      const client = await this.connect();
      if (!client) return false;

      const pipeline = client.multi();
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
        pipeline.setEx(key, ttl, serializedValue);
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Redis mset error:', error.message);
      return false;
    }
  }

  // Get multiple values
  async mget(keys) {
    try {
      const client = await this.connect();
      if (!client) return [];

      const values = await client.mGet(keys);
      return values.map(value => {
        if (!value) return null;
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      });
    } catch (error) {
      console.error('Redis mget error:', error.message);
      return [];
    }
  }

  // Increment counter
  async incr(key, ttl = 3600) {
    try {
      const client = await this.connect();
      if (!client) return null;

      const result = await client.incr(key);
      await client.expire(key, ttl);
      return result;
    } catch (error) {
      console.error('Redis incr error:', error.message);
      return null;
    }
  }

  // Get cache statistics
  async getStats() {
    try {
      const client = await this.connect();
      if (!client) return null;

      const info = await client.info('memory');
      return {
        connected: this.isConnected,
        info: info
      };
    } catch (error) {
      console.error('Redis stats error:', error.message);
      return { connected: this.isConnected, error: error.message };
    }
  }

  // Clear all cache (use with caution)
  async flushAll() {
    try {
      const client = await this.connect();
      if (!client) return false;

      await client.flushAll();
      return true;
    } catch (error) {
      console.error('Redis flushAll error:', error.message);
      return false;
    }
  }
}

// Create singleton instance
const redisService = new RedisService();

// Export functions for easy use
export const cache = {
  set: (key, value, ttl) => redisService.set(key, value, ttl),
  get: (key) => redisService.get(key),
  del: (key) => redisService.del(key),
  exists: (key) => redisService.exists(key),
  mset: (keyValuePairs, ttl) => redisService.mset(keyValuePairs, ttl),
  mget: (keys) => redisService.mget(keys),
  incr: (key, ttl) => redisService.incr(key, ttl),
  getStats: () => redisService.getStats(),
  flushAll: () => redisService.flushAll(),
  disconnect: () => redisService.disconnect()
};

// Cache keys for common data
export const CACHE_KEYS = {
  USER_PROFILE: (userId) => `user:profile:${userId}`,
  USER_SERVICES: (userId) => `user:services:${userId}`,
  USER_PAYMENTS: (userId) => `user:payments:${userId}`,
  SERVICE_DETAILS: (serviceId) => `service:details:${serviceId}`,
  COVERAGE_AREAS: 'coverage:areas',
  SERVICE_AREAS: 'service:areas',
  PAYMENT_STATS: 'payment:stats',
  USER_COUNT: 'stats:user:count',
  SERVICE_COUNT: 'stats:service:count',
  PAYMENT_COUNT: 'stats:payment:count'
};

// Cache TTL constants
export const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400 // 24 hours
};

export default redisService; 