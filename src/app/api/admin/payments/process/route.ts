import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get payment IDs from request
    const { paymentIds } = await request.json();
    
    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: paymentIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Process in transaction to ensure consistency
    const results = await prisma.$transaction(async (tx) => {
      const processingResults = [];
      
      for (const paymentId of paymentIds) {
        // Get payment details including employee's payment preferences
        const payment = await tx.payment.findUnique({
          where: { id: paymentId },
          include: {
            employee: {
              select: {
                id: true,
                cashAppUsername: true,
                stripeAccountId: true,
                preferredPaymentMethod: true
              }
            },
            referredBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            customer: {
              select: {
                id: true,
                cashAppName: true
              }
            }
          }
        });
        
        if (!payment || payment.status !== 'APPROVED') {
          processingResults.push({ 
            id: paymentId,
            status: 'SKIPPED', 
            notes: 'Payment not found or not in APPROVED status'
          });
          continue;
        }
        
        try {
          let processingMethod = '';
          let notes = '';
          let stripeTransferId = null;
          
          // Handle different payment types
          if (payment.type === 'EARNINGS' && payment.employee) {
            const employee = payment.employee;
            
            // NOTE: The payment.amount should already represent 75% of 1/4 of the subscription amount 
            // after Stripe fees, which is the scooper's portion. The other 25% is retained by the company.
            // This calculation should have been done when the payment record was created.
            
            // Determine payment method based on employee's preference
            if (employee.preferredPaymentMethod === 'STRIPE' && employee.stripeAccountId) {
              // Process via Stripe
              if (!employee.stripeAccountId) {
                throw new Error('Employee has Stripe as preferred payment method but no Stripe account is connected');
              }
              
              // Create a transfer to the connected account
              const transfer = await stripe.transfers.create({
                amount: Math.round(payment.amount * 100), // Convert to cents - this is already the 75% portion
                currency: 'usd',
                destination: employee.stripeAccountId,
                description: `Payment for service ID: ${payment.serviceId || 'N/A'} (75% of service fee)`
              });
              
              processingMethod = 'STRIPE';
              notes = `Transferred 75% to Stripe account: ${employee.stripeAccountId}`;
              stripeTransferId = transfer.id;
            } 
            else if (employee.preferredPaymentMethod === 'CASH_APP' && employee.cashAppUsername) {
              // Process via Cash App
              if (!employee.cashAppUsername) {
                throw new Error('Employee has Cash App as preferred payment method but no Cash App username is provided');
              }
              
              // Just mark as paid via Cash App - actual payment would happen through Cash App API or manually
              processingMethod = 'CASH_APP';
              notes = `Sent to Cash App: ${employee.cashAppUsername}`;
            }
            else if (employee.cashAppUsername) {
              // Fallback to Cash App if no preference but Cash App is available
              processingMethod = 'CASH_APP';
              notes = `Sent to Cash App: ${employee.cashAppUsername} (No preference set)`;
            }
            else if (employee.stripeAccountId) {
              // Fallback to Stripe if no preference but Stripe is available
              // Create a transfer to the connected account
              const transfer = await stripe.transfers.create({
                amount: Math.round(payment.amount * 100), // Convert to cents
                currency: 'usd',
                destination: employee.stripeAccountId,
                description: `Payment for service ID: ${payment.serviceId || 'N/A'}`
              });
              
              processingMethod = 'STRIPE';
              notes = `Transferred to Stripe account: ${employee.stripeAccountId} (No preference set)`;
              stripeTransferId = transfer.id;
            }
            else {
              throw new Error('No payment method available for employee');
            }
          } 
          else if (payment.type === 'REFERRAL' && payment.referredBy) {
            // Handle referral payment - always through Cash App for referrers
            const customer = await tx.customer.findFirst({
              where: { userId: payment.referredId! },
              select: { cashAppName: true }
            });
            
            if (!customer?.cashAppName) {
              throw new Error('No Cash App information for referrer');
            }
            
            // Just mark as paid via Cash App
            processingMethod = 'CASH_APP';
            notes = `Sent to Cash App: ${customer.cashAppName}`;
          } 
          else {
            throw new Error(`Invalid payment type or missing recipient information`);
          }
          
          // Update payment record
          const updatedPayment = await tx.payment.update({
            where: { id: paymentId },
            data: {
              status: 'PAID',
              paymentMethod: processingMethod,
              paidAt: new Date(),
              notes: notes,
              stripeTransferId
            }
          });
          
          processingResults.push({
            id: paymentId,
            status: 'PAID',
            method: processingMethod,
            notes: notes
          });
          
          // If this is a service payment, update the service status
          if (payment.serviceId) {
            await tx.service.update({
              where: { id: payment.serviceId },
              data: { 
                paymentStatus: 'PAID'
              }
            });
          }
        } catch (error) {
          console.error(`Error processing payment ${paymentId}:`, error);
          
          // Mark payment as failed
          await tx.payment.update({
            where: { id: paymentId },
            data: {
              status: 'FAILED',
              notes: `Failed to process: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          });
          
          processingResults.push({
            id: paymentId,
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      return processingResults;
    });

    return NextResponse.json({
      message: `Processed ${results.length} payments`,
      results
    });
  } catch (error) {
    console.error('Error processing payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 