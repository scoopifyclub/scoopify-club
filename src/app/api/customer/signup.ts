import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

// POST: Customer signup with zip code, referral, and payment
export async function POST(request: Request) {
  const data = await request.json();
  const { email, name, address, zipCode, referralCode, paymentMethodId } = data;

  // 1. Check if zip code is covered
  const coverage = await prisma.coverageArea.findFirst({
    where: { zipCode, active: true },
  });
  if (!coverage) {
    return NextResponse.json({ error: 'Service not available in your area.' }, { status: 400 });
  }

  // 2. Create user and customer records
  const user = await prisma.user.create({
    data: { email, name },
  });
  const customer = await prisma.customer.create({
    data: {
      userId: user.id,
      referralCode: referralCode || null,
      hasPaidCleanupFee: false,
      serviceCredits: 0,
    },
  });

  // 3. Stripe: create customer and charge for monthly + cleanup fee
  const stripeCustomer = await stripe.customers.create({
    email,
    name,
    metadata: { userId: user.id },
  });
  const monthlyAmount = 12900; // $129.00 (example)
  const cleanupFee = 6900;     // $69.00 (example)
  const totalAmount = monthlyAmount + cleanupFee;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount,
    currency: 'usd',
    customer: stripeCustomer.id,
    payment_method: paymentMethodId,
    confirm: true,
    metadata: { userId: user.id, type: 'signup' },
  });

  // 4. Update customer with Stripe info, credits, and cleanup fee paid
  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      stripeCustomerId: stripeCustomer.id,
      hasPaidCleanupFee: true,
      serviceCredits: 4,
    },
  });

  // 5. Referral payout (if referral code used)
  if (referralCode) {
    const ref = await prisma.referral.findUnique({ where: { code: referralCode } });
    if (ref) {
      await prisma.referral.update({
        where: { id: ref.id },
        data: { referredId: customer.id, payoutStatus: 'PENDING' },
      });
      // Optionally, create a Payment record for the referral bonus
    }
  }

  return NextResponse.json({ success: true });
}
