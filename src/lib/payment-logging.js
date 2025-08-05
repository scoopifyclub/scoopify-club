import { prisma } from '@/lib/prisma';

/**
 * Log payment events for security monitoring and audit trails
 */
export class PaymentLogger {
  /**
   * Log a payment attempt (successful or failed)
   */
  static async logPaymentAttempt(data) {
    try {
      const {
        customerId,
        amount,
        currency = 'usd',
        status, // 'SUCCESS', 'FAILED', 'PENDING'
        paymentMethod,
        stripePaymentIntentId,
        stripeCustomerId,
        errorCode,
        errorMessage,
        ipAddress,
        userAgent,
        metadata = {}
      } = data;

      // Log to database
      await prisma.paymentLog.create({
        data: {
          customerId,
          amount,
          currency,
          status,
          paymentMethod,
          stripePaymentIntentId,
          stripeCustomerId,
          errorCode,
          errorMessage,
          ipAddress,
          userAgent,
          metadata: JSON.stringify(metadata),
          timestamp: new Date()
        }
      });

      // Also log to console for immediate monitoring
      console.log(`[PAYMENT_LOG] ${status}: $${amount} ${currency} - Customer: ${customerId} - IP: ${ipAddress}`);
      
      if (errorCode) {
        console.error(`[PAYMENT_ERROR] ${errorCode}: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error logging payment attempt:', error);
    }
  }

  /**
   * Log webhook events
   */
  static async logWebhookEvent(data) {
    try {
      const {
        eventType,
        stripeEventId,
        status, // 'PROCESSED', 'FAILED', 'IGNORED'
        errorMessage,
        ipAddress,
        userAgent,
        metadata = {}
      } = data;

      // Log to database
      await prisma.webhookLog.create({
        data: {
          eventType,
          stripeEventId,
          status,
          errorMessage,
          ipAddress,
          userAgent,
          metadata: JSON.stringify(metadata),
          timestamp: new Date()
        }
      });

      // Log to console
      console.log(`[WEBHOOK_LOG] ${eventType}: ${status} - IP: ${ipAddress}`);
      
      if (errorMessage) {
        console.error(`[WEBHOOK_ERROR] ${eventType}: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error logging webhook event:', error);
    }
  }

  /**
   * Log security events
   */
  static async logSecurityEvent(data) {
    try {
      const {
        eventType, // 'webhook_signature_failed', 'rate_limit_exceeded', 'suspicious_activity'
        severity, // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
        description,
        ipAddress,
        userAgent,
        metadata = {}
      } = data;

      // Log to database
      await prisma.securityLog.create({
        data: {
          eventType,
          severity,
          description,
          ipAddress,
          userAgent,
          metadata: JSON.stringify(metadata),
          timestamp: new Date()
        }
      });

      // Log to console with appropriate level
      const logMessage = `[SECURITY_LOG] ${severity}: ${eventType} - ${description} - IP: ${ipAddress}`;
      
      switch (severity) {
        case 'CRITICAL':
          console.error(logMessage);
          break;
        case 'HIGH':
          console.warn(logMessage);
          break;
        case 'MEDIUM':
          console.warn(logMessage);
          break;
        case 'LOW':
          console.log(logMessage);
          break;
        default:
          console.log(logMessage);
      }
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  /**
   * Get payment statistics for monitoring
   */
  static async getPaymentStats(timeframe = '24h') {
    try {
      const now = new Date();
      let startTime;

      switch (timeframe) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const stats = await prisma.paymentLog.groupBy({
        by: ['status'],
        where: {
          timestamp: {
            gte: startTime
          }
        },
        _count: {
          status: true
        },
        _sum: {
          amount: true
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting payment stats:', error);
      return [];
    }
  }

  /**
   * Get security alerts for monitoring
   */
  static async getSecurityAlerts(timeframe = '24h') {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const alerts = await prisma.securityLog.findMany({
        where: {
          timestamp: {
            gte: startTime
          },
          severity: {
            in: ['HIGH', 'CRITICAL']
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 50
      });

      return alerts;
    } catch (error) {
      console.error('Error getting security alerts:', error);
      return [];
    }
  }

  /**
   * Check for suspicious activity patterns
   */
  static async checkSuspiciousActivity(ipAddress, timeframe = '1h') {
    try {
      const now = new Date();
      let startTime;

      switch (timeframe) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
      }

      // Check failed payment attempts
      const failedPayments = await prisma.paymentLog.count({
        where: {
          ipAddress,
          status: 'FAILED',
          timestamp: {
            gte: startTime
          }
        }
      });

      // Check security events
      const securityEvents = await prisma.securityLog.count({
        where: {
          ipAddress,
          severity: {
            in: ['HIGH', 'CRITICAL']
          },
          timestamp: {
            gte: startTime
          }
        }
      });

      // Check webhook failures
      const webhookFailures = await prisma.webhookLog.count({
        where: {
          ipAddress,
          status: 'FAILED',
          timestamp: {
            gte: startTime
          }
        }
      });

      // Define thresholds
      const isSuspicious = 
        failedPayments > 5 || 
        securityEvents > 3 || 
        webhookFailures > 2;

      return {
        isSuspicious,
        metrics: {
          failedPayments,
          securityEvents,
          webhookFailures
        }
      };
    } catch (error) {
      console.error('Error checking suspicious activity:', error);
      return { isSuspicious: false, metrics: {} };
    }
  }
}

/**
 * Convenience functions for common logging scenarios
 */
export const logPaymentSuccess = (data) => PaymentLogger.logPaymentAttempt({
  ...data,
  status: 'SUCCESS'
});

export const logPaymentFailure = (data) => PaymentLogger.logPaymentAttempt({
  ...data,
  status: 'FAILED'
});

export const logWebhookProcessed = (data) => PaymentLogger.logWebhookEvent({
  ...data,
  status: 'PROCESSED'
});

export const logWebhookFailed = (data) => PaymentLogger.logWebhookEvent({
  ...data,
  status: 'FAILED'
});

export const logSecurityAlert = (data) => PaymentLogger.logSecurityEvent({
  ...data,
  severity: 'HIGH'
});

export const logSecurityCritical = (data) => PaymentLogger.logSecurityEvent({
  ...data,
  severity: 'CRITICAL'
}); 