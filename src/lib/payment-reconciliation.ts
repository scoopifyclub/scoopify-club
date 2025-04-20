import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import { logPaymentEvent } from "@/lib/payment-audit";

/**
 * Match types for reconciliation results
 */
export type ReconciliationMatch = 
  | 'MATCHED' // Payment records match in both systems
  | 'AMOUNT_MISMATCH' // Payment amounts don't match
  | 'MISSING_FROM_STRIPE' // Payment marked as PAID in our system but not found in Stripe
  | 'MISSING_FROM_SYSTEM'; // Payment found in Stripe but not in our system

/**
 * Result of comparing payment records
 */
export interface ReconciliationResult {
  paymentId?: string;
  stripeId?: string;
  systemAmount?: number;
  stripeAmount?: number;
  matchStatus: ReconciliationMatch;
  notes: string;
  timestamp: Date;
}

/**
 * Reconcile payments with Stripe over a specific date range
 */
export async function reconcileStripePayments(
  startDate: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Default: last 7 days
  endDate: Date = new Date()
) {
  logger.info(`Starting payment reconciliation from ${startDate.toISOString()} to ${endDate.toISOString()}`);
  
  // 1. Get all payments in our system that should have a Stripe record
  const systemPayments = await prisma.payment.findMany({
    where: {
      status: 'PAID',
      paymentMethod: 'STRIPE',
      paidAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      id: true,
      amount: true,
      stripePaymentIntentId: true,
      stripeTransferId: true,
      paidAt: true
    }
  });
  
  logger.info(`Found ${systemPayments.length} system payments to reconcile`);
  
  // 2. Get all Stripe payments in the date range
  // This assumes you're using Payment Intents - adjust if using Charges or Transfers
  const stripePaymentIntents = await fetchStripePaymentIntents(startDate, endDate);
  const stripeTransfers = await fetchStripeTransfers(startDate, endDate);
  
  logger.info(`Found ${stripePaymentIntents.length} Stripe payment intents and ${stripeTransfers.length} transfers`);
  
  // 3. Match and compare records
  const results: ReconciliationResult[] = [];
  
  // Check system payments against Stripe records
  for (const payment of systemPayments) {
    if (payment.stripePaymentIntentId) {
      // This is a customer payment
      const stripePayment = stripePaymentIntents.find(p => p.id === payment.stripePaymentIntentId);
      
      if (!stripePayment) {
        results.push({
          paymentId: payment.id,
          stripeId: payment.stripePaymentIntentId,
          systemAmount: payment.amount,
          matchStatus: 'MISSING_FROM_STRIPE',
          notes: `Payment exists in system but not found in Stripe`,
          timestamp: new Date()
        });
        continue;
      }
      
      // Compare amounts (convert Stripe amount from cents to dollars)
      const stripeAmount = stripePayment.amount / 100;
      if (Math.abs(payment.amount - stripeAmount) > 0.01) { // Allow for small rounding differences
        results.push({
          paymentId: payment.id,
          stripeId: payment.stripePaymentIntentId,
          systemAmount: payment.amount,
          stripeAmount: stripeAmount,
          matchStatus: 'AMOUNT_MISMATCH',
          notes: `Amount mismatch: system has $${payment.amount}, Stripe has $${stripeAmount}`,
          timestamp: new Date()
        });
      } else {
        results.push({
          paymentId: payment.id,
          stripeId: payment.stripePaymentIntentId,
          systemAmount: payment.amount,
          stripeAmount: stripeAmount,
          matchStatus: 'MATCHED',
          notes: `Payment record matches Stripe`,
          timestamp: new Date()
        });
      }
    } else if (payment.stripeTransferId) {
      // This is a transfer to an employee/contractor
      const stripeTransfer = stripeTransfers.find(t => t.id === payment.stripeTransferId);
      
      if (!stripeTransfer) {
        results.push({
          paymentId: payment.id,
          stripeId: payment.stripeTransferId,
          systemAmount: payment.amount,
          matchStatus: 'MISSING_FROM_STRIPE',
          notes: `Transfer exists in system but not found in Stripe`,
          timestamp: new Date()
        });
        continue;
      }
      
      // Compare amounts (convert Stripe amount from cents to dollars)
      const stripeAmount = stripeTransfer.amount / 100;
      if (Math.abs(payment.amount - stripeAmount) > 0.01) {
        results.push({
          paymentId: payment.id,
          stripeId: payment.stripeTransferId,
          systemAmount: payment.amount,
          stripeAmount: stripeAmount,
          matchStatus: 'AMOUNT_MISMATCH',
          notes: `Amount mismatch for transfer: system has $${payment.amount}, Stripe has $${stripeAmount}`,
          timestamp: new Date()
        });
      } else {
        results.push({
          paymentId: payment.id,
          stripeId: payment.stripeTransferId,
          systemAmount: payment.amount,
          stripeAmount: stripeAmount,
          matchStatus: 'MATCHED',
          notes: `Transfer record matches Stripe`,
          timestamp: new Date()
        });
      }
    }
  }
  
  // Check for Stripe payments not in our system
  for (const stripePayment of stripePaymentIntents) {
    const systemPayment = systemPayments.find(p => p.stripePaymentIntentId === stripePayment.id);
    
    if (!systemPayment) {
      results.push({
        stripeId: stripePayment.id,
        stripeAmount: stripePayment.amount / 100,
        matchStatus: 'MISSING_FROM_SYSTEM',
        notes: `Payment exists in Stripe but not in our system`,
        timestamp: new Date()
      });
    }
  }
  
  // Check for Stripe transfers not in our system
  for (const stripeTransfer of stripeTransfers) {
    const systemPayment = systemPayments.find(p => p.stripeTransferId === stripeTransfer.id);
    
    if (!systemPayment) {
      results.push({
        stripeId: stripeTransfer.id,
        stripeAmount: stripeTransfer.amount / 100,
        matchStatus: 'MISSING_FROM_SYSTEM',
        notes: `Transfer exists in Stripe but not in our system`,
        timestamp: new Date()
      });
    }
  }
  
  // 4. Log and store reconciliation results
  await storeReconciliationResults(results);
  
  // 5. Log summary statistics
  const matchedCount = results.filter(r => r.matchStatus === 'MATCHED').length;
  const mismatchCount = results.filter(r => r.matchStatus === 'AMOUNT_MISMATCH').length;
  const missingFromStripeCount = results.filter(r => r.matchStatus === 'MISSING_FROM_STRIPE').length;
  const missingFromSystemCount = results.filter(r => r.matchStatus === 'MISSING_FROM_SYSTEM').length;
  
  logger.info(`
    Reconciliation complete:
    - Matched: ${matchedCount}
    - Amount mismatches: ${mismatchCount}
    - Missing from Stripe: ${missingFromStripeCount}
    - Missing from our system: ${missingFromSystemCount}
  `);
  
  // Return reconciliation report
  return {
    startDate,
    endDate,
    totalRecords: results.length,
    matched: matchedCount,
    amountMismatches: mismatchCount,
    missingFromStripe: missingFromStripeCount,
    missingFromSystem: missingFromSystemCount,
    results: results
  };
}

/**
 * Fetch payment intents from Stripe
 */
async function fetchStripePaymentIntents(startDate: Date, endDate: Date) {
  const paymentIntents: any[] = [];
  let hasMore = true;
  let startingAfter: string | undefined = undefined;
  
  // Stripe uses unix timestamps in seconds
  const created = {
    gte: Math.floor(startDate.getTime() / 1000),
    lte: Math.floor(endDate.getTime() / 1000)
  };
  
  try {
    while (hasMore) {
      const params: any = {
        limit: 100,
        created,
        status: 'succeeded',
        expand: ['data.customer']
      };
      
      if (startingAfter) {
        params.starting_after = startingAfter;
      }
      
      const response = await stripe.paymentIntents.list(params);
      
      paymentIntents.push(...response.data);
      
      hasMore = response.has_more;
      if (hasMore && response.data.length > 0) {
        startingAfter = response.data[response.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }
    
    return paymentIntents;
  } catch (error) {
    logger.error('Error fetching payment intents from Stripe:', error);
    throw error;
  }
}

/**
 * Fetch transfers from Stripe
 */
async function fetchStripeTransfers(startDate: Date, endDate: Date) {
  const transfers: any[] = [];
  let hasMore = true;
  let startingAfter: string | undefined = undefined;
  
  // Stripe uses unix timestamps in seconds
  const created = {
    gte: Math.floor(startDate.getTime() / 1000),
    lte: Math.floor(endDate.getTime() / 1000)
  };
  
  try {
    while (hasMore) {
      const params: any = {
        limit: 100,
        created,
        expand: ['data.destination']
      };
      
      if (startingAfter) {
        params.starting_after = startingAfter;
      }
      
      const response = await stripe.transfers.list(params);
      
      transfers.push(...response.data);
      
      hasMore = response.has_more;
      if (hasMore && response.data.length > 0) {
        startingAfter = response.data[response.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }
    
    return transfers;
  } catch (error) {
    logger.error('Error fetching transfers from Stripe:', error);
    throw error;
  }
}

/**
 * Store reconciliation results for future reference
 */
async function storeReconciliationResults(results: ReconciliationResult[]) {
  // Create reconciliation report
  const report = await prisma.paymentReconciliationReport.create({
    data: {
      timestamp: new Date(),
      totalRecords: results.length,
      matchedCount: results.filter(r => r.matchStatus === 'MATCHED').length,
      mismatchCount: results.filter(r => r.matchStatus === 'AMOUNT_MISMATCH').length,
      missingFromStripeCount: results.filter(r => r.matchStatus === 'MISSING_FROM_STRIPE').length, 
      missingFromSystemCount: results.filter(r => r.matchStatus === 'MISSING_FROM_SYSTEM').length
    }
  });
  
  // Store individual results
  for (const result of results) {
    if (result.matchStatus !== 'MATCHED' && result.paymentId) {
      // Log audit event for non-matching payments
      await logPaymentEvent(
        result.paymentId,
        'RECONCILIATION_ISSUE',
        {
          matchStatus: result.matchStatus,
          systemAmount: result.systemAmount,
          stripeAmount: result.stripeAmount,
          notes: result.notes
        }
      );
    }
    
    await prisma.paymentReconciliationItem.create({
      data: {
        reportId: report.id,
        paymentId: result.paymentId,
        stripeId: result.stripeId,
        systemAmount: result.systemAmount,
        stripeAmount: result.stripeAmount,
        matchStatus: result.matchStatus,
        notes: result.notes
      }
    });
  }
  
  return report.id;
}

/**
 * Get recent reconciliation reports
 */
export async function getRecentReconciliationReports(limit: number = 10) {
  return prisma.paymentReconciliationReport.findMany({
    take: limit,
    orderBy: { timestamp: 'desc' },
    include: {
      items: {
        where: {
          matchStatus: {
            not: 'MATCHED'
          }
        },
        take: 100
      }
    }
  });
}

/**
 * Get details of a specific reconciliation report
 */
export async function getReconciliationReport(reportId: string) {
  return prisma.paymentReconciliationReport.findUnique({
    where: { id: reportId },
    include: {
      items: true
    }
  });
} 