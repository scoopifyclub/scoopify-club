import { PrismaClient } from '@prisma/client';
import { isEdgeRuntime, isVercel, isProduction } from './vercel-runtime';

// Enhanced database configuration
const DB_CONFIG = {
  // Connection pool settings
  connection_limit: isVercel() && isProduction() ? 20 : 15,
  pool_timeout: 45, // Increased to 45 seconds
  idle_timeout: 90, // Increased to 90 seconds
  
  // Retry settings
  max_retries: 5,
  retry_delay_base: 1000, // Base delay in ms
  retry_delay_max: 30000, // Max delay in ms
  
  // Timeout settings
  connection_timeout: 30000, // 30 seconds
  query_timeout: 60000, // 60 seconds
  transaction_timeout: 120000, // 2 minutes
};

// Connection health monitoring
let connectionHealth = {
  lastCheck: Date.now(),
  isHealthy: true,
  consecutiveFailures: 0,
  totalQueries: 0,
  failedQueries: 0,
  averageQueryTime: 0,
};

// Health check interval (every 30 seconds)
const HEALTH_CHECK_INTERVAL = 30000;
let healthCheckInterval;

/**
 * Enhanced Prisma client with connection pooling and monitoring
 */
class EnhancedPrismaClient extends PrismaClient {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DIRECT_URL || process.env.DATABASE_URL
        }
      },
      // Enhanced engine configuration
      __internal: {
        engine: {
          connectionTimeout: DB_CONFIG.connection_timeout,
          pollInterval: 100,
          connectionLimit: DB_CONFIG.connection_limit,
          maxIdleTime: DB_CONFIG.idle_timeout * 1000,
          poolTimeout: DB_CONFIG.pool_timeout * 1000,
          queryTimeout: DB_CONFIG.query_timeout,
          transactionTimeout: DB_CONFIG.transaction_timeout,
        }
      }
    });

    // Set up query monitoring
    this.$on('query', (e) => {
      connectionHealth.totalQueries++;
      const queryTime = e.duration || 0;
      connectionHealth.averageQueryTime = 
        (connectionHealth.averageQueryTime * (connectionHealth.totalQueries - 1) + queryTime) / connectionHealth.totalQueries;
      
      // Log slow queries
      if (queryTime > 5000) { // 5 seconds
        console.warn(`[DB] Slow query detected: ${queryTime}ms`, {
          query: e.query,
          params: e.params,
          duration: queryTime
        });
      }
    });

    this.$on('error', (e) => {
      connectionHealth.failedQueries++;
      connectionHealth.consecutiveFailures++;
      connectionHealth.isHealthy = false;
      
      console.error('[DB] Database error:', e);
    });

    this.$on('info', (e) => {
      console.log('[DB] Database info:', e);
    });

    this.$on('warn', (e) => {
      console.warn('[DB] Database warning:', e);
    });
  }

  /**
   * Enhanced connect with retry logic
   */
  async connectWithRetry(retries = DB_CONFIG.max_retries) {
    try {
      await this.$connect();
      connectionHealth.isHealthy = true;
      connectionHealth.consecutiveFailures = 0;
      connectionHealth.lastCheck = Date.now();
      console.log('[DB] Successfully connected to database');
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      return true;
    } catch (error) {
      console.error(`[DB] Connection attempt failed:`, error);
      
      if (retries > 0) {
        const delay = Math.min(
          DB_CONFIG.retry_delay_base * Math.pow(2, DB_CONFIG.max_retries - retries),
          DB_CONFIG.retry_delay_max
        );
        
        console.log(`[DB] Retrying connection in ${delay}ms... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.connectWithRetry(retries - 1);
      } else {
        console.error('[DB] Failed to connect to database after multiple attempts');
        connectionHealth.isHealthy = false;
        return false;
      }
    }
  }

  /**
   * Enhanced disconnect with cleanup
   */
  async disconnectWithCleanup() {
    try {
      // Stop health monitoring
      this.stopHealthMonitoring();
      
      // Close all connections gracefully
      await this.$disconnect();
      console.log('[DB] Database connections closed gracefully');
    } catch (error) {
      console.error('[DB] Error during disconnect:', error);
    }
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
    }
    
    healthCheckInterval = setInterval(async () => {
      try {
        // Simple health check query
        await this.$queryRaw`SELECT 1`;
        connectionHealth.isHealthy = true;
        connectionHealth.consecutiveFailures = 0;
        connectionHealth.lastCheck = Date.now();
      } catch (error) {
        connectionHealth.isHealthy = false;
        connectionHealth.consecutiveFailures++;
        console.error('[DB] Health check failed:', error);
        
        // Attempt reconnection if too many consecutive failures
        if (connectionHealth.consecutiveFailures >= 3) {
          console.log('[DB] Attempting reconnection due to health check failures');
          await this.connectWithRetry(3);
        }
      }
    }, HEALTH_CHECK_INTERVAL);
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = null;
    }
  }

  /**
   * Get connection health status
   */
  getHealthStatus() {
    return {
      ...connectionHealth,
      uptime: Date.now() - connectionHealth.lastCheck,
      successRate: connectionHealth.totalQueries > 0 
        ? ((connectionHealth.totalQueries - connectionHealth.failedQueries) / connectionHealth.totalQueries * 100).toFixed(2)
        : 100
    };
  }

  /**
   * Execute query with timeout and retry
   */
  async executeWithTimeout(queryFn, timeout = DB_CONFIG.query_timeout) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout')), timeout);
    });

    try {
      const result = await Promise.race([queryFn(), timeoutPromise]);
      return result;
    } catch (error) {
      if (error.message === 'Query timeout') {
        throw new Error(`Database query timed out after ${timeout}ms`);
      }
      throw error;
    }
  }
}

// Create enhanced Prisma client instance
let enhancedPrisma;

if (!isEdgeRuntime()) {
  const globalForPrisma = globalThis;
  enhancedPrisma = globalForPrisma.enhancedPrisma ?? new EnhancedPrismaClient();
  
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.enhancedPrisma = enhancedPrisma;
  }
  
  // Connect to database asynchronously
  enhancedPrisma.connectWithRetry().catch((err) => {
    console.error('[DB] Failed to initiate database connection:', err);
    console.warn('[DB] App will continue but database operations may fail');
  });
} else {
  // Edge Runtime fallback
  enhancedPrisma = new Proxy({}, {
    get(target, prop) {
      if (prop === '$connect' || prop === '$disconnect') {
        return () => Promise.resolve();
      }
      throw new Error('EnhancedPrismaClient cannot be used in Edge Runtime');
    }
  });
}

// Export the enhanced client
export { enhancedPrisma as prisma };
export default enhancedPrisma;

/**
 * Enhanced database operation wrapper with retry logic
 */
export async function withEnhancedDatabase(operation, options = {}) {
  const {
    maxRetries = DB_CONFIG.max_retries,
    timeout = DB_CONFIG.query_timeout,
    retryDelay = DB_CONFIG.retry_delay_base
  } = options;

  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check connection health before operation
      if (!connectionHealth.isHealthy) {
        console.log(`[DB] Connection unhealthy, attempting reconnection (attempt ${attempt})`);
        await enhancedPrisma.connectWithRetry(3);
      }

      // Execute operation with timeout
      const result = await enhancedPrisma.executeWithTimeout(operation, timeout);
      
      // Reset failure counter on success
      connectionHealth.consecutiveFailures = 0;
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if it's a connection error that should trigger retry
      if (isConnectionError(error) && attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt - 1);
        console.log(`[DB] Connection error, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // For non-connection errors or last attempt, throw immediately
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * Check if error is a connection error
 */
function isConnectionError(error) {
  const connectionErrorCodes = ['P1001', 'P1002', 'P1008', 'P1017', 'P2024'];
  return connectionErrorCodes.includes(error.code) || 
         error.message?.toLowerCase().includes('connection') ||
         error.message?.toLowerCase().includes('timeout');
}

/**
 * Get database health status
 */
export function getDatabaseHealth() {
  return enhancedPrisma.getHealthStatus();
}

/**
 * Graceful shutdown
 */
export async function shutdownDatabase() {
  if (enhancedPrisma && typeof enhancedPrisma.disconnectWithCleanup === 'function') {
    await enhancedPrisma.disconnectWithCleanup();
  }
}

// Handle process termination
process.on('SIGINT', shutdownDatabase);
process.on('SIGTERM', shutdownDatabase);
