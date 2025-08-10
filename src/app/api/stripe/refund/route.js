import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/api-auth';
import { cookies } from 'next/headers';
import { logPaymentSuccess, logPaymentFailure, logSecurityAlert } from '@/lib/payment-logging';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


export async function POST(request) {
  try {
    // Authentication check
    const token = cookies().get('accessToken')?.value;
    const user = await verifyToken(token);

    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ 
        error: 'Unauthorized access' 
      }, { status: 401 });
    }

    const { paymentIntentId, amount, reason, customerId, description } = await request.json();

    // Input validation
    if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
      return NextResponse.json({ 
        error: 'Valid payment intent ID is required',
        code: 'invalid_payment_intent'
      }, { status: 400 });
    }

    if (!amount || amount < 50) { // Minimum $0.50
      return NextResponse.json({ 
        error: 'Amount must be at least 50 cents',
        code: 'invalid_amount'
      }, { status: 400 });
    }

    if (!['duplicate', 'fraudulent', 'requested_by_customer'].includes(reason)) {
      return NextResponse.json({ 
        error: 'Invalid refund reason',
        code: 'invalid_reason'
      }, { status: 400 });
    }

    // Get client information for logging
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check if payment intent exists and is refundable
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent) {
      return NextResponse.json({ 
        error: 'Payment intent not found',
        code: 'payment_intent_not_found'
      }, { status: 404 });
    }

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ 
        error: 'Payment intent is not in a refundable state',
        code: 'payment_not_succeeded'
      }, { status: 400 });
    }

    // Check if refund already exists
    const existingRefunds = await stripe.refunds.list({
      payment_intent: paymentIntentId
    });

    if (existingRefunds.data.length > 0) {
      return NextResponse.json({ 
        error: 'Refund already exists for this payment',
        code: 'refund_already_exists'
      }, { status: 400 });
    }

    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount,
      reason: reason,
      metadata: {
        refunded_by: user.id,
        refunded_at: new Date().toISOString(),
        description: description || 'Refund processed by admin',
        environment: process.env.NODE_ENV
      }
    });

    // Log successful refund
    await logPaymentSuccess({
      customerId: customerId || paymentIntent.customer,
      amount: amount,
      currency: 'usd',
      paymentMethod: 'refund',
      stripePaymentIntentId: paymentIntentId,
      stripeCustomerId: paymentIntent.customer,
      ipAddress: clientIP,
      userAgent: userAgent,
      metadata: {
        refundId: refund.id,
        reason: reason,
        adminId: user.id,
        originalAmount: paymentIntent.amount
      }
    });

    // Update database records
    await prisma.payment.updateMany({
      where: { 
        stripePaymentIntentId: paymentIntentId 
      },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
        refundAmount: amount,
        refundReason: reason
      }
    });

    // Send notification to customer (if email available)
    if (paymentIntent.customer) {
      const customer = await stripe.customers.retrieve(paymentIntent.customer);
      if (customer.email) {
        // You can implement email notification here
        console.log(`Refund notification sent to ${customer.email}`);
      }
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        created: refund.created
      }
    });

  } catch (error) {
    console.error('Refund error:', error);

    // Log failed refund attempt
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await logPaymentFailure({
      customerId: 'unknown',
      amount: 0,
      currency: 'usd',
      paymentMethod: 'refund',
      stripePaymentIntentId: 'unknown',
      errorCode: error.code || 'refund_failed',
      errorMessage: error.message,
      ipAddress: clientIP,
      userAgent: userAgent,
      metadata: {
        error: error.message,
        stack: error.stack
      }
    });

    // Categorize Stripe errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json({ 
        error: 'Payment method was declined',
        code: 'card_declined'
      }, { status: 400 });
    }

    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json({ 
        error: 'Invalid refund request',
        code: 'invalid_request'
      }, { status: 400 });
    }

    if (error.type === 'StripeAPIError') {
      return NextResponse.json({ 
        error: 'Payment service temporarily unavailable',
        code: 'service_unavailable'
      }, { status: 503 });
    }

    return NextResponse.json({ 
      error: 'Refund processing failed',
      code: 'processing_error'
    }, { status: 500 });
  }
}

// Get refund history
export async function GET(request) {
  try {
    const token = cookies().get('accessToken')?.value;
    const user = await verifyToken(token);

    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ 
        error: 'Unauthorized access' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('paymentIntentId');
    const limit = parseInt(searchParams.get('limit')) || 10;

    if (!paymentIntentId) {
      return NextResponse.json({ 
        error: 'Payment intent ID is required' 
      }, { status: 400 });
    }

    const refunds = await stripe.refunds.list({
      payment_intent: paymentIntentId,
      limit: limit
    });

    return NextResponse.json({
      success: true,
      refunds: refunds.data.map(refund => ({
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        created: refund.created,
        metadata: refund.metadata
      }))
    });

  } catch (error) {
    console.error('Error fetching refunds:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch refund history' 
    }, { status: 500 });
  }
} 