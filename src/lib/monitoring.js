import { prisma } from './prisma';

class Monitoring {
  constructor() {
    this.metrics = new Map();
    this.errorLog = [];
    this.performanceLog = [];
  }

  // Performance monitoring
  async trackPerformance(operation, duration, metadata = {}) {
    const metric = {
      operation,
      duration,
      timestamp: new Date(),
      metadata
    };

    this.performanceLog.push(metric);

    // Store in database for long-term analysis
    try {
      await prisma.performanceMetric.create({
        data: {
          operation,
          duration,
          metadata: JSON.stringify(metadata),
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to store performance metric:', error);
    }

    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${operation} took ${duration}ms`, metadata);
    }
  }

  // Error tracking
  async trackError(error, context = {}) {
    const errorLog = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date(),
      userAgent: context.userAgent,
      userId: context.userId,
      url: context.url
    };

    this.errorLog.push(errorLog);

    // Store in database
    try {
      await prisma.errorLog.create({
        data: {
          message: error.message,
          stack: error.stack,
          context: JSON.stringify(context),
          timestamp: new Date(),
          userAgent: context.userAgent || '',
          userId: context.userId || null,
          url: context.url || ''
        }
      });
    } catch (dbError) {
      console.error('Failed to store error log:', dbError);
    }

    // Send to external error tracking service if configured
    if (process.env.SENTRY_DSN) {
      // Sentry integration would go here
      console.error('Error tracked:', errorLog);
    }
  }

  // Business metrics
  async trackBusinessMetric(metric, value, metadata = {}) {
    const businessMetric = {
      metric,
      value,
      timestamp: new Date(),
      metadata
    };

    this.metrics.set(metric, businessMetric);

    // Store in database
    try {
      await prisma.businessMetric.create({
        data: {
          metric,
          value: typeof value === 'number' ? value : JSON.stringify(value),
          metadata: JSON.stringify(metadata),
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to store business metric:', error);
    }
  }

  // System health check
  async healthCheck() {
    const health = {
      database: false,
      redis: false,
      stripe: false,
      email: false,
      timestamp: new Date()
    };

    try {
      // Database health check
      await prisma.$queryRaw`SELECT 1`;
      health.database = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    try {
      // Redis health check (if using Redis)
      if (process.env.UPSTASH_REDIS_REST_URL) {
        const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
          headers: {
            'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
          }
        });
        health.redis = response.ok;
      }
    } catch (error) {
      console.error('Redis health check failed:', error);
    }

    try {
      // Stripe health check
      if (process.env.STRIPE_SECRET_KEY) {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        await stripe.paymentMethods.list({ limit: 1 });
        health.stripe = true;
      }
    } catch (error) {
      console.error('Stripe health check failed:', error);
    }

    try {
      // Email service health check
      if (process.env.RESEND_API_KEY) {
        const response = await fetch('https://api.resend.com/domains', {
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
          }
        });
        health.email = response.ok;
      }
    } catch (error) {
      console.error('Email service health check failed:', error);
    }

    return health;
  }

  // Get system statistics
  async getSystemStats() {
    try {
      const [
        totalCustomers,
        totalEmployees,
        totalServices,
        totalRevenue,
        activeServices,
        pendingServices
      ] = await Promise.all([
        prisma.customer.count(),
        prisma.employee.count(),
        prisma.service.count(),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: 'COMPLETED' }
        }),
        prisma.service.count({
          where: { status: 'IN_PROGRESS' }
        }),
        prisma.service.count({
          where: { status: 'PENDING' }
        })
      ]);

      return {
        customers: totalCustomers,
        employees: totalEmployees,
        services: totalServices,
        revenue: totalRevenue._sum.amount || 0,
        activeServices,
        pendingServices,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to get system stats:', error);
      return null;
    }
  }

  // Get performance metrics
  async getPerformanceMetrics(limit = 100) {
    try {
      return await prisma.performanceMetric.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit
      });
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return [];
    }
  }

  // Get error logs
  async getErrorLogs(limit = 100) {
    try {
      return await prisma.errorLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit
      });
    } catch (error) {
      console.error('Failed to get error logs:', error);
      return [];
    }
  }

  // Cleanup old logs
  async cleanupOldLogs(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
      await Promise.all([
        prisma.performanceMetric.deleteMany({
          where: { timestamp: { lt: cutoffDate } }
        }),
        prisma.errorLog.deleteMany({
          where: { timestamp: { lt: cutoffDate } }
        }),
        prisma.businessMetric.deleteMany({
          where: { timestamp: { lt: cutoffDate } }
        })
      ]);

      console.log(`Cleaned up logs older than ${daysToKeep} days`);
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }
}

// Create singleton instance
const monitoring = new Monitoring();

// Performance tracking middleware
export function withPerformanceTracking(operation) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args) {
      const start = Date.now();
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - start;
        await monitoring.trackPerformance(operation, duration, { success: true });
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        await monitoring.trackPerformance(operation, duration, { success: false, error: error.message });
        throw error;
      }
    };

    return descriptor;
  };
}

export { monitoring }; 