import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

// POST: Customer signup with zip code, referral, and payment
export async function POST(request: Request) {
  const data = await request.json();
  const { email, name, address, zipCode, referralCode, paymentMethodId, plan, numberOfDogs, preferredDay, startDate } = data;

  // 1. Check if zip code is covered by an active scooper (robust: use the new endpoint)
  let coveredZips: string[] = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/coverage-area/active-zips`);
    if (res.ok) {
      coveredZips = await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch covered zip codes:', err);
  }
  if (!coveredZips.includes(zipCode)) {
    // Notify admin of attempted signup in uncovered zip code
    try {
      const { sendAdminNotification } = await import('@/lib/email');
      await sendAdminNotification(
        'Attempted Signup in Uncovered Zip Code',
        `A user with email ${email} attempted to sign up in zip code ${zipCode} where there is no active scooper. Consider advertising in this area.`
      );
    } catch (e) {
      console.error('Failed to send admin notification for uncovered zip code:', e);
    }
    return NextResponse.json({ error: 'Service not available in your area. No active scooper assigned.' }, { status: 400 });
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

  // 3. Stripe: create customer and charge for monthly + 50%-off initial cleanup fee
  const stripeCustomer = await stripe.customers.create({
    email,
    name,
    metadata: { userId: user.id },
  });

  // Calculate monthly and cleanup fee (could be dynamic based on plan/numberOfDogs)
  const monthlyAmount = 12900; // $129.00 (example, TODO: make dynamic)
  const fullCleanupFee = 6900; // $69.00 (example, TODO: make dynamic)
  const discountedCleanupFee = Math.round(fullCleanupFee * 0.5); // 50% off
  const totalAmount = monthlyAmount + discountedCleanupFee;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount,
    currency: 'usd',
    customer: stripeCustomer.id,
    payment_method: paymentMethodId,
    confirm: true,
    metadata: { userId: user.id, type: 'signup', includesDiscountedCleanup: true },
  });

  // 3b. Compute the scheduled date for initial cleanup
  let requestedDate = startDate ? new Date(startDate) : new Date();
  const now = new Date();
  const msInDay = 24 * 60 * 60 * 1000;
  let wasBumped = false;
  // If requested date is less than 3 days from now, bump to same day next week
  if ((requestedDate.getTime() - now.getTime()) < 3 * msInDay) {
    requestedDate.setDate(requestedDate.getDate() + 7);
    wasBumped = true;
  }

  // Create initial cleanup service (job) for this customer using the INITIAL_CLEANUP plan
  const initialCleanupPlan = await prisma.servicePlan.findFirst({ where: { type: 'INITIAL_CLEANUP', isActive: true } });
  if (!initialCleanupPlan) {
    return NextResponse.json({ error: 'Initial cleanup plan not found.' }, { status: 500 });
  }
  const initialCleanupService = await prisma.service.create({
    data: {
      customerId: customer.id,
      status: 'SCHEDULED',
      scheduledDate: requestedDate,
      servicePlanId: initialCleanupPlan.id,
      potentialEarnings: discountedCleanupFee,
      paymentStatus: 'PAID',
      workflowStatus: 'AVAILABLE',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });

  // Schedule first recurring service on the preferred day
  let recurringConflict = false;
  let recurringOptions: string[] = [];
  let recurringScheduledDate: Date | null = null;
  if (plan === 'weekly' && preferredDay) {
    // Find the next occurrence of preferredDay after the initial cleanup
    const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const preferredDayIdx = daysOfWeek.indexOf(preferredDay.toUpperCase());
    let firstRecurring = new Date(requestedDate);
    let diff = (preferredDayIdx - firstRecurring.getDay() + 7) % 7;
    if (diff === 0) diff = 7; // Always push to next week if same day
    firstRecurring.setDate(firstRecurring.getDate() + diff);
    recurringScheduledDate = new Date(firstRecurring);

    // Check if recurring service is less than 3 days after initial cleanup
    const msDiff = firstRecurring.getTime() - requestedDate.getTime();
    if (msDiff < 3 * msInDay) {
      // If too close, push to the same preferred day the following week
      firstRecurring.setDate(firstRecurring.getDate() + 7);
    }
    // Always create the recurring service at the appropriate date
    const recurringPlan = await prisma.servicePlan.findFirst({ where: { type: 'WEEKLY', isActive: true } });
    if (recurringPlan) {
      await prisma.service.create({
        data: {
          customerId: customer.id,
          status: 'SCHEDULED',
          scheduledDate: firstRecurring,
          servicePlanId: recurringPlan.id,
          potentialEarnings: monthlyAmount / 4, // Example split
          paymentStatus: 'PENDING',
          workflowStatus: 'AVAILABLE',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
    }
  }

  // 4. Update customer with Stripe info, credits, and cleanup fee paid
  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      stripeCustomerId: stripeCustomer.id,
      hasPaidCleanupFee: true,
      serviceCredits: 4,
    },
  });
  // Optionally: log/track initial cleanup service ID on customer

  // 5. Referral code logic (robust)
  let referralStatus: string | null = null;
  if (referralCode) {
    // Validate referral code: must exist and be active
    const refCode = await prisma.referralCode.findUnique({ where: { code: referralCode } });
    if (!refCode || !refCode.active) {
      return NextResponse.json({ error: 'Invalid or inactive referral code.' }, { status: 400 });
    }
    // Determine referrer (customer, employee, or partner)
    let referrerId = refCode.ownerId || refCode.partnerId;
    let refType = refCode.type;
    if (!referrerId) {
      return NextResponse.json({ error: 'Referral code not linked to a valid referrer.' }, { status: 400 });
    }
    // Prevent self-referral (if userId matches referrerId)
    if (user.id === referrerId) {
      return NextResponse.json({ error: 'Self-referral is not allowed.' }, { status: 400 });
    }
    // Create Referral record
    await prisma.referral.create({
      data: {
        referrerId,
        referredId: customer.id,
        code: referralCode,
        status: 'PENDING',
        payoutStatus: 'PENDING',
        type: refType,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
    // Increment uses on referral code
    await prisma.referralCode.update({
      where: { code: referralCode },
      data: { uses: { increment: 1 } },
    });
    referralStatus = 'PENDING';
  }

  return NextResponse.json({ 
    success: true, 
    bumped: wasBumped,
    referralStatus
  });
}
