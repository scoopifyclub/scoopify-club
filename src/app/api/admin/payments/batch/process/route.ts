import { NextResponse } from 'next/server';


import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { logPaymentEvent } from '@/lib/payment-audit';
import { logger } from '@/lib/logger';
import stripe from '@/lib/stripe';

// POST: Process a batch of payments
export async function POST(request: Request) {
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

    const { batchId, paymentMethod } = await request.json();

    // Validate input
    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      );
    }

    // Process batch in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get batch with payments
      const batch = await tx.paymentBatch.findUnique({
        where: { id: batchId },
        include: {
          payments: {
            include: {
              employee: true,
              service: true,
              referral: true
            }
          }
        }
      });
      
      if (!batch) {
        throw new Error('Batch not found');
      }
      
      // Check if batch can be processed
      if (batch.status !== 'SCHEDULED' && batch.status !== 'PROCESSING') {
        throw new Error(`Cannot process batch in ${batch.status} status`);
      }
      
      // Update batch status to PROCESSING
      const updatedBatch = await tx.paymentBatch.update({
        where: { id: batchId },
        data: {
          status: 'PROCESSING',
          processedDate: new Date(),
          processedBy: userId
        }
      });
      
      // Process each payment
      const results = {
        successful: 0,
        failed: 0,
        processed: [],
        errors: []
      };
      
      for (const payment of batch.payments) {
        try {
          // Skip already paid payments
          if (payment.status === 'PAID') {
            continue;
          }
          
          // Only process approved payments
          if (payment.status !== 'APPROVED') {
            throw new Error(`Payment ${payment.id} is not in APPROVED status`);
          }
          
          let paymentSuccess = false;
          let paymentNote = '';
          let stripeTransferId = null;
          
          // Process payment based on method
          switch (paymentMethod) {
            case 'STRIPE':
              if (payment.type === 'EARNINGS' && payment.employee?.stripeAccountId) {
                // Process Stripe transfer
                const transfer = await stripe.transfers.create({
                  amount: Math.round(payment.amount * 100), // Convert to cents
                  currency: 'usd',
                  destination: payment.employee.stripeAccountId,
                  description: `Payment for ${payment.type.toLowerCase()} - ID: ${payment.id}`
                });
                
                paymentSuccess = true;
                paymentNote = `Processed via Stripe. Transfer ID: ${transfer.id}`;
                stripeTransferId = transfer.id;
              } else {
                throw new Error('Stripe account not available for payment');
              }
              break;
              
            case 'CASH_APP':
              if (payment.type === 'EARNINGS' && payment.employee?.cashAppUsername) {
                // Log Cash App payment
                paymentSuccess = true;
                paymentNote = `Ready for Cash App payment to ${payment.employee.cashAppUsername}`;
              } else if (payment.type === 'REFERRAL' && payment.referral?.user?.cashAppUsername) {
                paymentSuccess = true;
                paymentNote = `Ready for Cash App payment to ${payment.referral.user.cashAppUsername}`;
              } else {
                throw new Error('Cash App username not available for payment');
              }
              break;
              
            case 'CHECK':
              // Log check payment
              paymentSuccess = true;
              paymentNote = 'Payment to be sent via check';
              break;
              
            case 'CASH':
              // Log cash payment
              paymentSuccess = true;
              paymentNote = 'Payment to be made in cash';
              break;
              
            default:
              throw new Error(`Unsupported payment method: ${paymentMethod}`);
          }
          
          // Update payment record
          if (paymentSuccess) {
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: 'PAID',
                paidAt: new Date(),
                paymentMethod,
                notes: payment.notes ? `${payment.notes}\n${paymentNote}` : paymentNote,
                stripeTransferId
              }
            });
            
            // Log payment event
            await logPaymentEvent(
              payment.id,
              'PAYMENT_PROCESSED',
              {
                batchId,
                method: paymentMethod,
                adminId: userId,
                stripeTransferId
              },
              userId
            );
            
            results.successful++;
            results.processed.push({
              id: payment.id,
              amount: payment.amount,
              type: payment.type,
              recipient: payment.type === 'EARNINGS' ? payment.employee?.name : payment.referral?.user?.name,
              method: paymentMethod
            });
          }
        } catch (error) {
          // Log payment failure
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: 'FAILED',
              notes: payment.notes 
                ? `${payment.notes}\nPayment processing failed: ${errorMessage}`
                : `Payment processing failed: ${errorMessage}`
            }
          });
          
          // Log payment event
          await logPaymentEvent(
            payment.id,
            'PAYMENT_FAILED',
            {
              batchId,
              method: paymentMethod,
              adminId: userId,
              error: errorMessage
            },
            userId
          );
          
          results.failed++;
          results.errors.push({
            id: payment.id,
            error: errorMessage
          });
          
          logger.error(`Error processing payment ${payment.id}:`, error);
        }
      }
      
      // Update batch status based on results
      if (results.failed === 0 && results.successful > 0) {
        await tx.paymentBatch.update({
          where: { id: batchId },
          data: {
            status: 'COMPLETED',
            completedDate: new Date()
          }
        });
      } else if (results.successful === 0) {
        await tx.paymentBatch.update({
          where: { id: batchId },
          data: {
            status: 'FAILED',
            completedDate: new Date()
          }
        });
      } else {
        await tx.paymentBatch.update({
          where: { id: batchId },
          data: {
            status: 'PARTIALLY_COMPLETED',
            completedDate: new Date()
          }
        });
      }
      
      return {
        batchId,
        status: results.failed === 0 ? 'COMPLETED' : 'PARTIALLY_COMPLETED',
        results
      };
    });
    
    return NextResponse.json({
      message: 'Batch processing completed',
      batchResult: result
    });
  } catch (error) {
    logger.error('Error processing payment batch:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process payment batch' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    );
  }
} 