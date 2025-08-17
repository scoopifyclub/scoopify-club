import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/api-auth';
import { Stripe } from 'stripe';

// POST: Admin approves a completed service for payout
export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await request.json();
  const { serviceId } = data;
  if (!serviceId) {
    return NextResponse.json({ error: 'Missing serviceId' }, { status: 400 });
  }
  // Find the service
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || service.workflowStatus !== 'COMPLETED') {
    return NextResponse.json({ error: 'Service is not ready for approval' }, { status: 400 });
  }
  // Update service as approved
  await prisma.service.update({
    where: { id: serviceId },
    data: {
      workflowStatus: 'APPROVED',
      paymentApprovedAt: new Date(),
      paymentApprovedBy: user.userId,
    },
  });

  // Payout logic (Stripe/Cash App)
  // Fetch service, employee, and payment info
  const approvedService = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!approvedService) {
    return NextResponse.json({ error: 'Service not found after approval' }, { status: 404 });
  }
  const scooper = await prisma.employee.findUnique({ where: { userId: approvedService.employeeId } });
  if (!scooper) {
    return NextResponse.json({ error: 'Scooper not found' }, { status: 404 });
  }
  // Calculate payout (75% of netAmount minus fees)
  const baseAmount = approvedService.netAmount || 0;
  const payoutAmount = Math.round(baseAmount * 0.75 * 100) / 100; // round to cents

  // Payout via Stripe or Cash App
  let payoutStatus = 'PENDING';
  let payoutId = null;
  if (scooper.preferredPaymentMethod === 'STRIPE' && scooper.stripeConnectAccountId) {
    try {
      // Implement Stripe Connect transfer
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const transfer = await stripe.transfers.create({
        amount: Math.round(payoutAmount * 100), // in cents
        currency: 'usd',
        destination: scooper.stripeConnectAccountId,
        transfer_group: serviceId,
        description: `Payment for service ${serviceId}`,
      });
      payoutStatus = 'PAID';
      payoutId = transfer.id;
      console.log(`✅ Stripe transfer created: ${transfer.id} for $${payoutAmount}`);
    } catch (stripeError) {
      console.error('❌ Stripe transfer failed:', stripeError);
      // Fall back to pending status
      payoutStatus = 'FAILED';
    }
  } else if (scooper.preferredPaymentMethod === 'CASHAPP' && scooper.cashAppUsername) {
    try {
      // Implement Cash App payout logic
      // For now, mark as pending manual payment until Cash App API integration is complete
      payoutStatus = 'PENDING_MANUAL';
      payoutId = `CASHAPP_${serviceId}_${Date.now()}`;
      
      // Create notification for manual Cash App payment
      await prisma.notification.create({
        data: {
          userId: scooper.userId,
          type: 'PAYOUT_PENDING',
          title: 'Cash App Payment Pending',
          message: `Your payment of $${payoutAmount} for service ${serviceId} is pending manual Cash App transfer. Please contact admin for payment details.`,
          createdAt: new Date(),
        },
      });
      
      // Also notify admin about manual payment needed
      await prisma.notification.create({
        data: {
          userId: 'admin', // Admin notification
          type: 'MANUAL_PAYMENT_NEEDED',
          title: 'Manual Cash App Payment Required',
          message: `Manual Cash App payment of $${payoutAmount} needed for scooper ${scooper.user?.firstName || 'Unknown'} (${scooper.cashAppUsername}) for service ${serviceId}`,
          createdAt: new Date(),
        },
      });
      
      console.log(`✅ Cash App payment marked as pending manual for ${scooper.cashAppUsername}`);
    } catch (cashAppError) {
      console.error('❌ Cash App payment processing failed:', cashAppError);
      payoutStatus = 'FAILED';
    }
  }

  // Mark payout in database (Earning/Payment model)
  await prisma.earning.create({
    data: {
      amount: payoutAmount,
      status: payoutStatus,
      serviceId: serviceId,
      employeeId: scooper.userId,
      paidVia: scooper.preferredPaymentMethod || null,
      paidAt: payoutStatus === 'PAID' ? new Date() : null,
      stripeTransferId: payoutId,
      approvedAt: new Date(),
      approvedBy: user.userId,
    },
  });

  // Check for referral and process referral payment if applicable
  const customer = await prisma.customer.findUnique({ 
    where: { id: approvedService.customerId },
    include: { user: true }
  });
  
  if (customer?.referrerId) {
    // Find the referral record
    const referral = await prisma.referral.findFirst({ 
      where: { 
        referrerId: customer.referrerId,
        referredId: customer.id,
        status: 'ACTIVE'
      } 
    });
    
    if (referral && referral.payoutStatus !== 'PAID') {
      // Process referral payment ($5/month)
      try {
        // Update referral status
        await prisma.referral.update({
          where: { id: referral.id },
          data: {
            payoutStatus: 'PAID',
            payoutAmount: 5.00, // $5 monthly referral fee
            payoutDate: new Date(),
          },
        });
        
        // Create referral payout record
        await prisma.referralPayout.create({
          data: {
            referralId: referral.id,
            amount: 5.00,
            status: 'COMPLETED',
            processedAt: new Date()
          }
        });
        
        // Notify referrer about referral payment
        await prisma.notification.create({
          data: {
            userId: customer.referrerId,
            type: 'REFERRAL_PAYOUT',
            title: 'Referral Bonus Earned',
            message: `You earned $5 for referring ${customer.user.firstName || 'a customer'}!`,
            createdAt: new Date(),
          },
        });
      } catch (error) {
        console.error('Error processing referral payment:', error);
      }
    }
  }

  // Notify scooper
  await prisma.notification.create({
    data: {
      userId: scooper.userId,
      type: 'PAYOUT',
      title: 'Job Approved & Payout Sent',
      message: `Your job for service ${serviceId} has been approved and your payout is being processed.`,
      createdAt: new Date(),
    },
  });
  
  // Notify customer
  if (approvedService.customerId) {
    await prisma.notification.create({
      data: {
        userId: approvedService.customerId,
        type: 'SERVICE_COMPLETE',
        title: 'Service Completed',
        message: 'Your service has been completed and approved. Thank you!',
        createdAt: new Date(),
      },
    });
  }

  return NextResponse.json({ success: true });
}
