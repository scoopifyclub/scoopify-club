# ScoopifyClub Payment System Documentation

This comprehensive guide documents the payment system in ScoopifyClub, including its architecture, workflows, integration with external payment providers, and best practices for development and operations.

## Table of Contents

1. [System Overview](#system-overview)
2. [Payment Workflows](#payment-workflows)
3. [Error Handling and Recovery](#error-handling-and-recovery)
4. [Payment Reconciliation](#payment-reconciliation)
5. [Audit Logging](#audit-logging)
6. [Transaction Isolation](#transaction-isolation)
7. [External Integrations](#external-integrations)
8. [Customer Communication](#customer-communication)
9. [Tax Reporting](#tax-reporting)
10. [Fee Structure](#fee-structure)
11. [Refund Handling](#refund-handling)
12. [Payment Scheduling](#payment-scheduling)
13. [Security Considerations](#security-considerations)
14. [Troubleshooting](#troubleshooting)

## System Overview

The ScoopifyClub payment system handles various types of financial transactions:

- **Subscription Payments**: Recurring payments from customers for service subscriptions
- **One-time Service Payments**: Individual payments for specific services
- **Employee Earnings**: Payments to employees (scoopers) for completed services
- **Referral Payments**: Rewards to customers for referring new subscribers

### Database Schema

The payment system relies on several interconnected tables:

- `Payment`: Records all financial transactions
- `PaymentRetry`: Tracks failed payment recovery attempts
- `Earning`: Records employee payments for completed services
- `Subscription`: Manages recurring billing information
- `Service`: Connects payments to specific service deliveries
- `Referral`: Tracks customer referral relationships

## Payment Workflows

### Subscription Payment Flow

1. Customer signs up and enters payment details in Stripe Checkout
2. Stripe processes payment and sends webhook notification
3. System creates subscription and payment records
4. System generates scheduled services
5. System processes referral payment if applicable

### Service Payment Flow

1. Employee completes service and marks it in the system
2. Admin reviews and approves service completion
3. System calculates payment distribution
4. Admin processes approved payments (batch or individual)
5. Payments are sent via Stripe or Cash App
6. System updates records with payment status

### Referral Payment Flow

1. New customer signs up using a referral code
2. When the referred customer's subscription payment succeeds
3. System creates a $5 referral payment (status: PENDING)
4. Admin approves referral payment
5. System processes payment via Cash App or Stripe
6. Payment is marked as PAID with receipt information

## Error Handling and Recovery

### Payment Retry Mechanism

The system implements an automated payment retry mechanism with exponential backoff:

1. Failed payments are automatically marked for retry
2. Retry schedule: First retry after 24 hours, then 3 days, then 7 days
3. Maximum of 3 retry attempts before requiring manual intervention
4. Each retry is logged with detailed error information
5. Customer is notified of failed payment and retry attempts

### Implementation

```typescript
// Payment retry process
export async function retryFailedPayments() {
  // Find scheduled retries that are due
  const paymentRetries = await prisma.paymentRetry.findMany({
    where: {
      status: 'SCHEDULED',
      nextRetryDate: {
        lte: new Date()
      }
    },
    include: {
      payment: {
        include: {
          customer: true,
          subscription: true
        }
      }
    }
  });
  
  // Process each retry with error handling
  for (const retry of paymentRetries) {
    try {
      // Update retry status to PENDING
      // Attempt payment processing
      // Update status based on result
      // Schedule next retry if needed
    } catch (error) {
      // Record failure with detailed error information
    }
  }
}
```

### Triggering Retries

- **Automated**: Daily cron job at `/api/cron/retry-payments`
- **Manual**: Admin-triggered from the admin dashboard
- **Customer-initiated**: Via customer dashboard after fixing payment method

## Payment Reconciliation

To ensure payment system integrity, ScoopifyClub implements a robust reconciliation process:

### Daily Reconciliation

1. Nightly job compares internal payment records with Stripe/Cash App transactions
2. Identifies discrepancies:
   - Payments marked as PAID without corresponding Stripe/Cash App records
   - Stripe/Cash App transactions without corresponding system records
   - Amount mismatches between systems
3. Generates reconciliation report for admin review
4. Flags suspicious transactions for manual investigation

### Implementation

Add a new endpoint at `/api/admin/payments/reconcile` that:

```typescript
export async function reconcilePayments() {
  // 1. Fetch all payments marked as PAID in the last 7 days
  const recentPayments = await prisma.payment.findMany({
    where: {
      status: 'PAID',
      paidAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    }
  });
  
  // 2. Fetch corresponding transactions from Stripe
  const stripeTransactions = await fetchStripeTransactions();
  
  // 3. Match and compare records
  const matchResults = matchAndCompareRecords(recentPayments, stripeTransactions);
  
  // 4. Generate reconciliation report
  return generateReconciliationReport(matchResults);
}
```

### Monthly Audit

1. Comprehensive monthly audit of all payment records
2. Verification of payment distribution calculations
3. Reconciliation with accounting system
4. Review of failed payments and recovery rates

## Audit Logging

The payment system maintains comprehensive audit logs for all financial activities:

### Audit Event Types

1. **Payment Status Changes**: Any change to payment status
2. **Payment Approvals**: Admin approval of payments
3. **Payment Processing**: Actual money movement events
4. **Manual Adjustments**: Any manual changes to payment records
5. **System Events**: Automated system actions (retries, batch processing)

### Implementation

```typescript
// Enhanced logging for payment system
export async function logPaymentEvent(
  paymentId: string,
  eventType: PaymentEventType,
  details: any,
  userId?: string
) {
  await prisma.paymentAuditLog.create({
    data: {
      paymentId,
      eventType,
      details: JSON.stringify(details),
      performedBy: userId || 'SYSTEM',
      timestamp: new Date()
    }
  });
}
```

### Log Retention

- Payment audit logs are retained for 7 years
- Logs are stored in a separate database table for performance
- Monthly backup to secure long-term storage
- Admin interface to search and review audit logs

## Transaction Isolation

The payment system uses appropriate transaction isolation levels to ensure data integrity:

### Transaction Requirements

1. **Serializable Isolation**: For critical payment operations
2. **Pessimistic Locking**: When updating payment records
3. **Transaction Boundaries**: Clear boundaries for atomic operations

### Implementation

```typescript
// Example of proper transaction usage
export async function processPayments(paymentIds: string[]) {
  return prisma.$transaction(async (tx) => {
    // Process each payment in the transaction
    const results = [];
    for (const paymentId of paymentIds) {
      // Process payment with proper error handling
      // Add result to results array
    }
    return results;
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 5000,
    timeout: 10000
  });
}
```

## External Integrations

### Stripe Integration

- **Payment Processing**: Primary payment processor for subscriptions
- **Connect Accounts**: Used for transferring money to employees
- **Webhooks**: Real-time event handling for payment events
- **Error Handling**: Comprehensive error mapping and recovery

### Cash App Integration

#### Current Implementation
Currently, the system marks payments for Cash App processing but requires manual sending through the Cash App interface.

#### Enhanced Integration
Implement Cash App API integration for automated payments:

```typescript
export async function sendCashAppPayment(
  recipient: string,
  amount: number,
  note: string
) {
  try {
    // Call Cash App API to send payment
    const response = await cashApp.payments.create({
      recipient_id: recipient,
      amount: amount,
      currency: 'USD',
      note: note
    });
    
    return {
      success: true,
      cashAppPaymentId: response.id
    };
  } catch (error) {
    logPaymentError('cash_app_send_failure', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

## Customer Communication

Enhance the payment system with robust customer notifications:

### Notification Types

1. **Payment Success**: Confirmation of successful payment
2. **Payment Failure**: Alert when payment fails with recovery steps
3. **Payment Retry**: Notification before payment retry attempt
4. **Earnings Available**: Alert for employees when earnings are processed
5. **Referral Payment**: Notification of referral payment processing

### Implementation

```typescript
export async function sendPaymentNotification(
  userId: string,
  notificationType: PaymentNotificationType,
  paymentData: any
) {
  // Get user's notification preferences
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, notificationPreferences: true }
  });
  
  // Send email notification
  if (user.notificationPreferences.email[notificationType]) {
    await sendEmail(
      user.email,
      getEmailTemplate(notificationType),
      {
        ...paymentData,
        user: { name: user.name }
      }
    );
  }
  
  // Send push notification if enabled
  if (user.notificationPreferences.push[notificationType]) {
    await sendPushNotification(userId, notificationType, paymentData);
  }
}
```

## Tax Reporting

The payment system collects and organizes information for tax reporting:

### Contractor Payments

- Records all necessary information for 1099 forms
- Tracks earnings by contractor throughout the tax year
- Provides year-end tax summaries for contractors
- Exports data in formats compatible with tax software

### Customer Payments

- Generates receipts for all payments
- Maintains history for business expense documentation
- Provides annual payment summaries

### Implementation

```typescript
export async function generateTaxSummary(
  employeeId: string,
  taxYear: number
) {
  // Get all earnings for the employee in the tax year
  const earnings = await prisma.earning.findMany({
    where: {
      employeeId,
      paidAt: {
        gte: new Date(`${taxYear}-01-01`),
        lt: new Date(`${taxYear + 1}-01-01`)
      },
      status: 'PAID'
    }
  });
  
  // Calculate total earnings and taxes
  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
  
  return {
    employeeId,
    taxYear,
    totalEarnings,
    formattedFor1099: true
  };
}
```

## Fee Structure

The system provides clear documentation and transparency about payment fees:

### Fee Types

1. **Stripe Processing Fee**: 2.9% + $0.30 per transaction
2. **Cash App Fee**: 0% for standard transfers, 1.5% for instant transfers
3. **Referral Fee**: $5 flat fee per active referral per month

### Fee Responsibility

- **Subscription Fees**: Paid by the business (deducted from revenue)
- **Referral Payment Fees**: Deducted from the recipient's amount
- **Employee Payment Fees**: Depends on payment method
  - Stripe: Paid by the business
  - Cash App: Instant transfer fees paid by employee if selected

### Implementation

```typescript
export function calculateNetAmount(
  grossAmount: number,
  paymentMethod: string,
  instantTransfer: boolean = false
) {
  let fee = 0;
  
  if (paymentMethod === 'STRIPE') {
    // Stripe fee: 2.9% + $0.30
    fee = (grossAmount * 0.029) + 0.30;
  } else if (paymentMethod === 'CASH_APP' && instantTransfer) {
    // Cash App instant transfer fee: 1.5%
    fee = grossAmount * 0.015;
  }
  
  return {
    grossAmount,
    fee,
    netAmount: grossAmount - fee
  };
}
```

## Refund Handling

The payment system now includes comprehensive refund handling:

### Refund Types

1. **Full Refund**: Complete refund of payment amount
2. **Partial Refund**: Refund portion of payment amount
3. **Service Credit**: Issue credit instead of monetary refund

### Refund Process

1. Admin initiates refund with reason code from dashboard
2. System validates refund eligibility
3. Refund is processed through original payment method
4. All affected records are updated (Payment, Service, etc.)
5. Customer is notified of refund status
6. Refund is included in reconciliation process

### Implementation

```typescript
export async function processRefund(
  paymentId: string,
  amount: number,
  reason: string,
  adminId: string
) {
  return prisma.$transaction(async (tx) => {
    // Get payment details
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { customer: true, service: true }
    });
    
    if (!payment) throw new Error('Payment not found');
    
    // Validate refund eligibility
    if (payment.status !== 'PAID') {
      throw new Error('Only paid payments can be refunded');
    }
    
    // Process refund via Stripe or Cash App
    const refundResult = await processRefundWithProvider(
      payment,
      amount,
      reason
    );
    
    // Update payment record
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        refundedAmount: amount,
        refundedAt: new Date(),
        refundedBy: adminId,
        refundReason: reason,
        refundStatus: 'COMPLETED',
        refundTransactionId: refundResult.transactionId
      }
    });
    
    // Update service if applicable
    if (payment.service) {
      await tx.service.update({
        where: { id: payment.service.id },
        data: {
          paymentStatus: amount === payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED'
        }
      });
    }
    
    // Log the refund event
    await logPaymentEvent(
      paymentId,
      'PAYMENT_REFUNDED',
      { amount, reason, adminId },
      adminId
    );
    
    // Send notification to customer
    await sendPaymentNotification(
      payment.customer.userId,
      'PAYMENT_REFUNDED',
      { payment, refundAmount: amount, reason }
    );
    
    return { success: true, refundId: refundResult.transactionId };
  });
}
```

## Payment Scheduling

The payment system now includes optimized payment scheduling:

### Batch Processing

1. **Weekly Processing**: Employee payments processed on fixed days (e.g., Fridays)
2. **Monthly Processing**: Referral payments processed on the 1st of each month
3. **Approval Windows**: Payments must be approved by specific times to be included

### Payment Calendar

- Admin dashboard displays payment calendar with scheduled batches
- Approval deadlines clearly indicated
- Payment volume and total amount forecasting
- Cash flow planning tools

### Implementation

```typescript
export async function scheduleBatchPayment(
  paymentType: string,
  processingDate: Date
) {
  // Create payment batch record
  const batch = await prisma.paymentBatch.create({
    data: {
      type: paymentType,
      scheduledDate: processingDate,
      status: 'SCHEDULED',
      approvalDeadline: new Date(processingDate.getTime() - 24 * 60 * 60 * 1000)
    }
  });
  
  // Associate eligible payments with this batch
  const eligiblePayments = await prisma.payment.findMany({
    where: {
      type: paymentType,
      status: 'APPROVED',
      batch: null
    }
  });
  
  await prisma.payment.updateMany({
    where: {
      id: { in: eligiblePayments.map(p => p.id) }
    },
    data: {
      batchId: batch.id
    }
  });
  
  return {
    batchId: batch.id,
    paymentCount: eligiblePayments.length,
    totalAmount: eligiblePayments.reduce((sum, p) => sum + p.amount, 0)
  };
}
```

## Security Considerations

The payment system implements robust security measures:

1. **PCI Compliance**: No card data stored in our systems (delegated to Stripe)
2. **Access Controls**: Role-based permissions for payment operations
3. **Audit Trails**: Comprehensive logging of all payment actions
4. **Encryption**: Sensitive payment details encrypted at rest
5. **API Security**: Strong authentication for payment endpoints
6. **Fraud Detection**: Monitoring for suspicious payment patterns

## Troubleshooting

Common issues and their solutions:

### Failed Payments

1. **Issue**: Payment failed due to insufficient funds
   **Solution**: System automatically retries payment after delay; customer can update payment method

2. **Issue**: Payment failed due to expired card
   **Solution**: Send notification to customer to update card details

### Reconciliation Errors

1. **Issue**: Payment marked as paid but no Stripe record
   **Solution**: Check payment method (might be Cash App); verify manual processing

2. **Issue**: Payment amounts don't match between systems
   **Solution**: Check for partial refunds or adjustments

### Missing Referral Payments

1. **Issue**: Referral payment not created
   **Solution**: Verify referral relationship active when payment processed

2. **Issue**: Referral payment stuck in pending
   **Solution**: Check approval queue; verify recipient payment details 