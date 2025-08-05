// Simple in-memory cache fallback for development
class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  async set(key, value, ttl = 3600) {
    try {
      // Clear existing timer if any
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
      }

      // Store the value
      this.cache.set(key, {
        value,
        timestamp: Date.now(),
        ttl: ttl * 1000
      });

      // Set expiration timer
      const timer = setTimeout(() => {
        this.cache.delete(key);
        this.timers.delete(key);
      }, ttl * 1000);

      this.timers.set(key, timer);
      return true;
    } catch (error) {
      console.error('Simple cache set error:', error.message);
      return false;
    }
  }

  async get(key) {
    try {
      const item = this.cache.get(key);
      if (!item) return null;

      // Check if expired
      const now = Date.now();
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        if (this.timers.has(key)) {
          clearTimeout(this.timers.get(key));
          this.timers.delete(key);
        }
        return null;
      }

      return item.value;
    } catch (error) {
      console.error('Simple cache get error:', error.message);
      return null;
    }
  }

  async del(key) {
    try {
      const deleted = this.cache.delete(key);
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
      }
      return deleted;
    } catch (error) {
      console.error('Simple cache del error:', error.message);
      return false;
    }
  }

  async exists(key) {
    try {
      return this.cache.has(key);
    } catch (error) {
      console.error('Simple cache exists error:', error.message);
      return false;
    }
  }

  async mset(keyValuePairs, ttl = 3600) {
    try {
      for (const [key, value] of Object.entries(keyValuePairs)) {
        await this.set(key, value, ttl);
      }
      return true;
    } catch (error) {
      console.error('Simple cache mset error:', error.message);
      return false;
    }
  }

  async mget(keys) {
    try {
      const values = [];
      for (const key of keys) {
        values.push(await this.get(key));
      }
      return values;
    } catch (error) {
      console.error('Simple cache mget error:', error.message);
      return [];
    }
  }

  async incr(key, ttl = 3600) {
    try {
      const current = await this.get(key);
      const newValue = (current || 0) + 1;
      await this.set(key, newValue, ttl);
      return newValue;
    } catch (error) {
      console.error('Simple cache incr error:', error.message);
      return null;
    }
  }

  async getStats() {
    try {
      return {
        connected: true,
        type: 'simple-memory',
        size: this.cache.size,
        timers: this.timers.size
      };
    } catch (error) {
      console.error('Simple cache stats error:', error.message);
      return { connected: false, error: error.message };
    }
  }

  async flushAll() {
    try {
      // Clear all timers
      for (const timer of this.timers.values()) {
        clearTimeout(timer);
      }
      
      this.cache.clear();
      this.timers.clear();
      return true;
    } catch (error) {
      console.error('Simple cache flushAll error:', error.message);
      return false;
    }
  }

  async disconnect() {
    await this.flushAll();
  }
}

// Create singleton instance
const simpleCache = new SimpleCache();

// Export functions for easy use
export const cache = {
  set: (key, value, ttl) => simpleCache.set(key, value, ttl),
  get: (key) => simpleCache.get(key),
  del: (key) => simpleCache.del(key),
  exists: (key) => simpleCache.exists(key),
  mset: (keyValuePairs, ttl) => simpleCache.mset(keyValuePairs, ttl),
  mget: (keys) => simpleCache.mget(keys),
  incr: (key, ttl) => simpleCache.incr(key, ttl),
  getStats: () => simpleCache.getStats(),
  flushAll: () => simpleCache.flushAll(),
  disconnect: () => simpleCache.disconnect()
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

export default simpleCache; 