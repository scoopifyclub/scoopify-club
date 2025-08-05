// API optimization middleware for improved performance
import { cache, CACHE_KEYS, CACHE_TTL } from './simple-cache.js';

/**
 * API Response Optimizer
 * Optimizes API responses for better performance
 */
export class ApiOptimizer {
  constructor() {
    this.compressionThreshold = 1024; // Compress responses > 1KB
    this.cacheEnabled = true;
    this.rateLimitEnabled = true;
  }

  /**
   * Optimize API response with caching and compression
   */
  async optimizeResponse(req, res, data, options = {}) {
    const {
      cacheKey = null,
      ttl = CACHE_TTL.MEDIUM,
      compress = true,
      headers = {},
      statusCode = 200
    } = options;

    try {
      // Set optimized headers
      this.setOptimizedHeaders(res, headers);

      // Cache the response if enabled and cacheKey provided
      if (this.cacheEnabled && cacheKey && req.method === 'GET') {
        await cache.set(cacheKey, data, ttl);
      }

      // Compress response if enabled and data is large enough
      if (compress && this.shouldCompress(data)) {
        this.enableCompression(res);
      }

      // Set status and send response
      res.status(statusCode).json({
        success: true,
        data: data,
        timestamp: new Date().toISOString(),
        cached: this.cacheEnabled && cacheKey ? true : false
      });

    } catch (error) {
      console.error('API optimization error:', error.message);
      // Fallback to basic response
      res.status(statusCode).json({
        success: true,
        data: data,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get cached response if available
   */
  async getCachedResponse(cacheKey) {
    if (!this.cacheEnabled || !cacheKey) return null;
    
    try {
      const cached = await cache.get(cacheKey);
      return cached;
    } catch (error) {
      console.error('Cache retrieval error:', error.message);
      return null;
    }
  }

  /**
   * Invalidate cache for specific keys
   */
  async invalidateCache(keys) {
    if (!this.cacheEnabled) return;
    
    try {
      if (Array.isArray(keys)) {
        for (const key of keys) {
          await cache.del(key);
        }
      } else {
        await cache.del(keys);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error.message);
    }
  }

  /**
   * Set optimized headers for better performance
   */
  setOptimizedHeaders(res, customHeaders = {}) {
    const defaultHeaders = {
      'Cache-Control': 'public, max-age=300, s-maxage=600',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-src 'none'; object-src 'none';"
    };

    // Merge default and custom headers
    const headers = { ...defaultHeaders, ...customHeaders };
    
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }

  /**
   * Enable compression for large responses
   */
  enableCompression(res) {
    res.setHeader('Content-Encoding', 'gzip');
    // Note: Actual compression would be handled by middleware
  }

  /**
   * Check if response should be compressed
   */
  shouldCompress(data) {
    const dataSize = JSON.stringify(data).length;
    return dataSize > this.compressionThreshold;
  }

  /**
   * Rate limiting helper
   */
  async checkRateLimit(key, limit = 100, window = 3600) {
    if (!this.rateLimitEnabled) return { allowed: true, remaining: limit };
    
    try {
      const current = await cache.incr(key, window);
      const remaining = Math.max(0, limit - current);
      
      return {
        allowed: current <= limit,
        current,
        remaining,
        reset: Date.now() + (window * 1000)
      };
    } catch (error) {
      console.error('Rate limit check error:', error.message);
      return { allowed: true, remaining: limit };
    }
  }

  /**
   * Pagination helper
   */
  paginateData(data, page = 1, limit = 10) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = data.slice(startIndex, endIndex);
    
    return {
      data: paginatedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: data.length,
        totalPages: Math.ceil(data.length / limit),
        hasNext: endIndex < data.length,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Error response helper
   */
  errorResponse(res, error, statusCode = 500) {
    const errorData = {
      success: false,
      error: {
        message: error.message || 'Internal server error',
        code: error.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      }
    };

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
      errorData.error.message = 'Internal server error';
      errorData.error.code = 'INTERNAL_ERROR';
    }

    this.setOptimizedHeaders(res);
    res.status(statusCode).json(errorData);
  }

  /**
   * Success response helper
   */
  successResponse(res, data, statusCode = 200, options = {}) {
    return this.optimizeResponse(res, res, data, {
      statusCode,
      ...options
    });
  }

  /**
   * Batch request helper
   */
  async batchRequest(requests) {
    const results = [];
    const errors = [];

    for (const request of requests) {
      try {
        const result = await request();
        results.push(result);
      } catch (error) {
        errors.push({
          request: request.name || 'unknown',
          error: error.message
        });
      }
    }

    return {
      results,
      errors,
      success: errors.length === 0
    };
  }

  /**
   * Performance monitoring
   */
  monitorPerformance(req, res, next) {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { method, url } = req;
      const { statusCode } = res;
      
      console.log(`📊 API Performance: ${method} ${url} - ${statusCode} (${duration}ms)`);
      
      // Log slow requests
      if (duration > 1000) {
        console.warn(`⚠️  Slow API Request: ${method} ${url} took ${duration}ms`);
      }
    });
    
    next();
  }
}

// Create singleton instance
const apiOptimizer = new ApiOptimizer();

// Export functions for easy use
export const optimizeApi = {
  response: (req, res, data, options) => apiOptimizer.optimizeResponse(req, res, data, options),
  getCached: (key) => apiOptimizer.getCachedResponse(key),
  invalidateCache: (keys) => apiOptimizer.invalidateCache(keys),
  rateLimit: (key, limit, window) => apiOptimizer.checkRateLimit(key, limit, window),
  paginate: (data, page, limit) => apiOptimizer.paginateData(data, page, limit),
  error: (res, error, statusCode) => apiOptimizer.errorResponse(res, error, statusCode),
  success: (res, data, statusCode, options) => apiOptimizer.successResponse(res, data, statusCode, options),
  batch: (requests) => apiOptimizer.batchRequest(requests),
  monitor: (req, res, next) => apiOptimizer.monitorPerformance(req, res, next)
};

export default apiOptimizer; 