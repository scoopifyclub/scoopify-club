import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
/**
 * Log a payment-related event for audit purposes
 * @param paymentId - ID of the payment
 * @param eventType - Type of event
 * @param details - JSON-serializable object with event details
 * @param performedBy - User ID of the person who performed the action, or 'SYSTEM' for automated events
 */
export async function logPaymentEvent(paymentId, eventType, details, performedBy = 'SYSTEM') {
    try {
        await prisma.paymentAuditLog.create({
            data: {
                paymentId,
                eventType,
                details: JSON.stringify(details),
                performedBy,
                timestamp: new Date()
            }
        });
        logger.info(`Payment audit: ${eventType} for payment ${paymentId} by ${performedBy}`);
    }
    catch (error) {
        logger.error(`Failed to log payment event ${eventType} for ${paymentId}:`, error);
        // Don't throw - logging failures shouldn't break business logic
    }
}
/**
 * Log a payment status change
 */
export async function logPaymentStatusChange(paymentId, oldStatus, newStatus, performedBy = 'SYSTEM', notes) {
    return logPaymentEvent(paymentId, 'STATUS_CHANGED', {
        oldStatus,
        newStatus,
        notes
    }, performedBy);
}
/**
 * Get audit history for a payment
 */
export async function getPaymentAuditHistory(paymentId) {
    return prisma.paymentAuditLog.findMany({
        where: { paymentId },
        orderBy: { timestamp: 'desc' }
    });
}
/**
 * Get recent audit events for admin dashboard
 */
export async function getRecentAuditEvents(limit = 50) {
    return prisma.paymentAuditLog.findMany({
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
            payment: {
                select: {
                    amount: true,
                    status: true,
                    type: true,
                    customer: {
                        select: {
                            name: true
                        }
                    },
                    employee: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        }
    });
}
/**
 * Search audit logs by criteria
 */
export async function searchAuditLogs({ paymentId, eventType, performedBy, startDate, endDate, page = 1, limit = 20 }) {
    const where = {};
    if (paymentId) {
        where.paymentId = paymentId;
    }
    if (eventType) {
        where.eventType = eventType;
    }
    if (performedBy) {
        where.performedBy = performedBy;
    }
    if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) {
            where.timestamp.gte = startDate;
        }
        if (endDate) {
            where.timestamp.lte = endDate;
        }
    }
    const [records, total] = await Promise.all([
        prisma.paymentAuditLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                payment: {
                    select: {
                        amount: true,
                        status: true,
                        type: true
                    }
                }
            }
        }),
        prisma.paymentAuditLog.count({ where })
    ]);
    return {
        records,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
}
