import { NextResponse } from 'next/server';


import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { logPaymentEvent } from '@/lib/payment-audit';
import { logger } from '@/lib/logger';

export async function POST(
  request: Request,
  { params }: { params: { paymentId: string } }
) {
  try {
    // Verify admin permission
    // Get access token from cookies
const cookieStore = await cookies();
const accessToken = cookieStore.get('accessToken')?.value;

if (!accessToken) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Validate the token and check role
const { userId, role } = await validateUser(accessToken);
    if (role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { paymentId } = params;
    const { amount, reason } = await request.json();

    // Validate input
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid refund amount' },
        { status: 400 }
      );
    }

    // Process refund in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get payment details
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          customer: true,
          service: true
        }
      });
      
      if (!payment) {
        throw new Error('Payment not found');
      }
      
      if (payment.status !== 'PAID') {
        throw new Error('Only paid payments can be refunded');
      }
      
      if (amount > payment.amount) {
        throw new Error('Refund amount cannot exceed payment amount');
      }
      
      // Check if already refunded
      if (payment.refundedAmount && payment.refundedAmount > 0) {
        // Allow partial refunds but check total doesn't exceed original amount
        if (payment.refundedAmount + amount > payment.amount) {
          throw new Error('Total refund amount would exceed payment amount');
        }
      }
      
      // Process refund based on payment method
      let refundTransactionId: string | undefined;
      
      if (payment.paymentMethod === 'STRIPE' && payment.stripePaymentIntentId) {
        // Process Stripe refund
        const refund = await stripe.refunds.create({
          payment_intent: payment.stripePaymentIntentId,
          amount: Math.round(amount * 100), // Convert to cents
          reason: mapRefundReason(reason)
        });
        
        refundTransactionId = refund.id;
      } else if (payment.paymentMethod === 'CASH_APP') {
        // For Cash App, we just record the refund - actual refund is manual
        refundTransactionId = undefined;
      } else {
        // For other payment methods, record but require manual processing
        refundTransactionId = undefined;
      }
      
      // Update payment record
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          refundedAmount: payment.refundedAmount 
            ? payment.refundedAmount + amount 
            : amount,
          refundedAt: new Date(),
          refundedBy: userId,
          refundReason: reason || 'Admin initiated refund',
          refundStatus: 'COMPLETED',
          refundTransactionId
        }
      });
      
      // Update service if applicable
      if (payment.service) {
        await tx.service.update({
          where: { id: payment.service.id },
          data: {
            paymentStatus: amount === payment.amount 
              ? 'REFUNDED' 
              : 'PARTIALLY_REFUNDED'
          }
        });
      }
      
      // Log the refund event
      await logPaymentEvent(
        paymentId,
        'PAYMENT_REFUNDED',
        {
          amount,
          reason,
          adminId: userId,
          refundTransactionId
        },
        userId
      );
      
      return {
        success: true,
        payment: updatedPayment,
        refundTransactionId
      };
    });
    
    // Send notification to customer (would be implemented separately)
    // await sendRefundNotification(result.payment.customerId, result.payment.id, amount, reason);
    
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error processing refund:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process refund' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    );
  }
}

// Map our reason codes to Stripe reason codes
function mapRefundReason(reason: string): 'duplicate' | 'fraudulent' | 'requested_by_customer' {
  switch (reason) {
    case 'DUPLICATE':
      return 'duplicate';
    case 'FRAUD':
      return 'fraudulent';
    default:
      return 'requested_by_customer';
  }
} 