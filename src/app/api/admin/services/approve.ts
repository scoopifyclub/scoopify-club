import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/api-auth';

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
  if (scooper.preferredPaymentMethod === 'STRIPE' && scooper.stripeAccountId) {
    // Stripe payout logic
    // TODO: Set up Stripe Connect transfer
    // Example:
    // const transfer = await stripe.transfers.create({
    //   amount: Math.round(payoutAmount * 100), // in cents
    //   currency: 'usd',
    //   destination: scooper.stripeAccountId,
    //   transfer_group: serviceId,
    // });
    // payoutStatus = 'PAID';
    // payoutId = transfer.id;
  } else if (scooper.preferredPaymentMethod === 'CASHAPP' && scooper.cashAppUsername) {
    // TODO: Implement Cash App payout logic here
    // payoutStatus = 'PAID';
    // payoutId = 'cashapp-transaction-id';
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

  // Referral payout logic (only if not already paid)
  const refCustomer = await prisma.customer.findUnique({ where: { id: approvedService.customerId } });
  if (refCustomer?.referredBy) {
    const referral = await prisma.referral.findFirst({ where: { referredId: refCustomer.id } });
    if (referral && referral.payoutStatus !== 'PAID') {
      // TODO: Send referral payout (Stripe/Cash App/manual)
      await prisma.referral.update({
        where: { id: referral.id },
        data: {
          payoutStatus: 'PAID',
          payoutAmount: 20, // Example: $20 referral bonus
          payoutDate: new Date(),
        },
      });
      // Optionally: create Payment/Earning record for referral
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
  // Referral payout notification
  const customer = await prisma.customer.findUnique({ where: { id: approvedService.customerId } });
  if (customer?.referredBy) {
    // TODO: Send referral payout if not already paid
    await prisma.notification.create({
      data: {
        userId: customer.referredBy,
        type: 'REFERRAL_PAYOUT',
        title: 'Referral Bonus Earned',
        message: `A referral bonus has been earned for referring customer ${customer.id}.`,
        createdAt: new Date(),
      },
    });
  }
  return NextResponse.json({ success: true });
}
