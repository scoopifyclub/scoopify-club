import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from "@/lib/prisma";
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';
export async function POST(request) {
    var _a, _b, _c, _d, _e;
    const body = await request.text();
    const signature = headers().get('stripe-signature');
    if (!signature) {
        return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        logger.error('Webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }
    logger.info(`Processing Stripe webhook: ${event.type}`);
    try {
        switch (event.type) {
            case 'customer.created': {
                const stripeCustomer = event.data.object;
                logger.info(`Processing new Stripe customer: ${stripeCustomer.id}`);
                // Find or create a customer
                let customer = await prisma.customer.findFirst({
                    where: {
                        user: { email: stripeCustomer.email }
                    },
                    include: { user: true }
                });
                if (!customer) {
                    // Create new user if customer doesn't exist
                    const user = await prisma.user.create({
                        data: {
                            email: stripeCustomer.email,
                            name: stripeCustomer.name || 'New Customer',
                            password: "", // Will set up with password reset
                            emailverified: true,
                            role: "CUSTOMER"
                        }
                    });
                    // Create customer record 
                    customer = await prisma.customer.create({
                        data: {
                            userId: user.id,
                            stripeCustomerId: stripeCustomer.id
                        },
                        include: { user: true }
                    });
                }
                else if (!customer.stripeCustomerId) {
                    // Update existing customer with Stripe ID if not set
                    await prisma.customer.update({
                        where: { id: customer.id },
                        data: { stripeCustomerId: stripeCustomer.id }
                    });
                }
                break;
            }
            case 'customer.updated': {
                const stripeCustomer = event.data.object;
                // Find customer by Stripe ID
                const customer = await prisma.customer.findUnique({
                    where: { stripeCustomerId: stripeCustomer.id }
                });
                if (customer) {
                    // If email has changed, we might need to update our user record
                    if (stripeCustomer.email) {
                        const user = await prisma.user.findUnique({
                            where: { id: customer.userId }
                        });
                        if (user && user.email !== stripeCustomer.email) {
                            // Optionally update user email to match Stripe
                            // This depends on your business logic - you might not want to do this
                            // await prisma.user.update({
                            //   where: { id: user.id },
                            //   data: { email: stripeCustomer.email }
                            // });
                            logger.info(`Note: Stripe customer email (${stripeCustomer.email}) differs from user email (${user.email})`);
                        }
                    }
                    logger.info(`Processed update for Stripe customer ${stripeCustomer.id}`);
                }
                else {
                    logger.warn(`No customer found with Stripe ID ${stripeCustomer.id}`);
                    // If customer not found by Stripe ID, try to find by email as a fallback
                    if (stripeCustomer.email) {
                        const user = await prisma.user.findUnique({
                            where: { email: stripeCustomer.email },
                            include: { customer: true }
                        });
                        if (user === null || user === void 0 ? void 0 : user.customer) {
                            // Update our customer with the Stripe ID
                            await prisma.customer.update({
                                where: { id: user.customer.id },
                                data: { stripeCustomerId: stripeCustomer.id }
                            });
                            logger.info(`Updated customer ${user.customer.id} with Stripe ID ${stripeCustomer.id} based on email match`);
                        }
                    }
                }
                break;
            }
            case 'customer.subscription.created': {
                const subscription = event.data.object;
                // Get the customer from our database
                const customer = await prisma.customer.findUnique({
                    where: { stripeCustomerId: subscription.customer },
                    include: { subscription: true }
                });
                if (!customer) {
                    logger.error(`Customer not found for subscription ${subscription.id}`);
                    break;
                }
                // Determine plan type based on billing interval
                const plan = ((_a = subscription.items.data[0].price.recurring) === null || _a === void 0 ? void 0 : _a.interval) === 'week'
                    ? 'WEEKLY'
                    : ((_b = subscription.items.data[0].price.recurring) === null || _b === void 0 ? void 0 : _b.interval_count) === 2
                        ? 'BIWEEKLY'
                        : 'MONTHLY';
                // If no subscription exists for the customer, create one
                if (!customer.subscription) {
                    await prisma.subscription.create({
                        data: {
                            customerId: customer.id,
                            status: subscription.status === 'active' ? 'ACTIVE' : 'PENDING',
                            planType: plan,
                            startDate: new Date(),
                            cancelAtPeriodEnd: subscription.cancel_at_period_end,
                            priceId: subscription.items.data[0].price.id
                        }
                    });
                }
                else {
                    // Update existing subscription
                    await prisma.subscription.update({
                        where: { id: customer.subscription.id },
                        data: {
                            status: subscription.status === 'active' ? 'ACTIVE' : 'PENDING',
                            planType: plan,
                            cancelAtPeriodEnd: subscription.cancel_at_period_end,
                            priceId: subscription.items.data[0].price.id
                        }
                    });
                }
                break;
            }
            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                // Get the customer from our database
                const customer = await prisma.customer.findUnique({
                    where: { stripeCustomerId: subscription.customer },
                    include: { subscription: true }
                });
                if (!customer || !customer.subscription) {
                    logger.error(`Customer or subscription not found for subscription ${subscription.id}`);
                    break;
                }
                // Map Stripe status to our status
                let status = customer.subscription.status;
                if (subscription.status === 'active') {
                    status = 'ACTIVE';
                }
                else if (subscription.status === 'canceled') {
                    status = 'CANCELLED';
                }
                else if (subscription.status === 'past_due') {
                    status = 'PAST_DUE';
                }
                else if (subscription.status === 'paused') {
                    status = 'PAUSED';
                }
                // Update the subscription
                await prisma.subscription.update({
                    where: { id: customer.subscription.id },
                    data: {
                        status,
                        cancelAtPeriodEnd: subscription.cancel_at_period_end,
                        // If the subscription was updated from paused to active, record the resume date
                        resumeDate: subscription.status === 'active' && customer.subscription.status === 'PAUSED'
                            ? new Date()
                            : customer.subscription.resumeDate
                    }
                });
                logger.info(`Updated subscription ${customer.subscription.id} to ${status}`);
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                // Get the customer from our database
                const customer = await prisma.customer.findUnique({
                    where: { stripeCustomerId: subscription.customer },
                    include: { subscription: true }
                });
                if (!customer || !customer.subscription) {
                    logger.error(`Customer or subscription not found for subscription ${subscription.id}`);
                    break;
                }
                // Update the subscription status to CANCELLED
                await prisma.subscription.update({
                    where: { id: customer.subscription.id },
                    data: {
                        status: 'CANCELLED',
                        endDate: new Date()
                    }
                });
                logger.info(`Cancelled subscription ${customer.subscription.id}`);
                break;
            }
            case 'customer.subscription.paused': {
                const subscription = event.data.object;
                // Get the customer from our database
                const customer = await prisma.customer.findUnique({
                    where: { stripeCustomerId: subscription.customer },
                    include: { subscription: true }
                });
                if (!customer || !customer.subscription) {
                    logger.error(`Customer or subscription not found for subscription ${subscription.id}`);
                    break;
                }
                // Update the subscription status to PAUSED
                await prisma.subscription.update({
                    where: { id: customer.subscription.id },
                    data: {
                        status: 'PAUSED',
                        pauseDate: new Date()
                    }
                });
                logger.info(`Paused subscription ${customer.subscription.id}`);
                break;
            }
            case 'customer.subscription.resumed': {
                const subscription = event.data.object;
                // Get the customer from our database
                const customer = await prisma.customer.findUnique({
                    where: { stripeCustomerId: subscription.customer },
                    include: { subscription: true }
                });
                if (!customer || !customer.subscription) {
                    logger.error(`Customer or subscription not found for subscription ${subscription.id}`);
                    break;
                }
                // Update the subscription status to ACTIVE
                await prisma.subscription.update({
                    where: { id: customer.subscription.id },
                    data: {
                        status: 'ACTIVE',
                        resumeDate: new Date()
                    }
                });
                logger.info(`Resumed subscription ${customer.subscription.id}`);
                break;
            }
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                // Get the customer from our database
                const customer = await prisma.customer.findUnique({
                    where: { stripeCustomerId: invoice.customer },
                    include: {
                        subscription: true,
                        services: {
                            where: {
                                status: 'SCHEDULED',
                            },
                            include: {
                                employee: true
                            },
                            orderBy: {
                                scheduledDate: 'asc'
                            },
                            take: 1
                        },
                        referredBy: {
                            include: {
                                user: true
                            }
                        }
                    }
                });
                if (!customer) {
                    logger.error(`Customer not found for invoice ${invoice.id}`);
                    break;
                }
                // Calculate Stripe fee and net amount
                const stripeFee = invoice.total > 0 ? (invoice.total * 0.029 + 30) : 0; // 2.9% + 30¢
                const netAmount = invoice.amount_paid / 100 - stripeFee / 100; // Net amount after fees
                // Create payment record
                const payment = await prisma.payment.create({
                    data: {
                        amount: invoice.amount_paid / 100, // Convert from cents to dollars
                        stripeFee: stripeFee / 100, // Convert from cents to dollars
                        netAmount: netAmount, // Net amount after fees
                        status: 'COMPLETED',
                        type: 'SUBSCRIPTION',
                        customerId: customer.id,
                        subscriptionId: (_c = customer.subscription) === null || _c === void 0 ? void 0 : _c.id,
                        stripePaymentIntentId: invoice.payment_intent,
                        stripeInvoiceId: invoice.id
                    }
                });
                // Calculate and create earnings for the scooper if assigned
                if ((_d = customer.services[0]) === null || _d === void 0 ? void 0 : _d.employee) {
                    const employee = customer.services[0].employee;
                    // Calculate scooper earnings (75% of net amount after fees)
                    const earningsAmount = netAmount * 0.75;
                    // Create earnings record
                    await prisma.earning.create({
                        data: {
                            amount: earningsAmount,
                            status: 'PENDING',
                            paymentId: payment.id,
                            employeeId: employee.id,
                            paidVia: employee.cashAppUsername ? 'CASH_APP' : 'STRIPE'
                        }
                    });
                    // If there's a referral, create the referral payment
                    if (customer.referredBy) {
                        // Calculate Stripe fee for the $5 payment (this will be deducted from the recipient's amount)
                        const referralFee = (5 * 0.029) + 0.30; // 2.9% + $0.30
                        // Actual amount the recipient will receive after Stripe fees
                        const netReferralAmount = 5 - referralFee;
                        await prisma.payment.create({
                            data: {
                                amount: 5.00, // Gross amount is $5
                                stripeFee: referralFee, // Track the fee that will be charged to recipient
                                netAmount: netReferralAmount, // Net amount recipient will receive
                                status: 'PENDING',
                                type: 'REFERRAL',
                                customerId: customer.referredBy.id,
                                referredId: customer.id,
                                notes: `Referral payment for customer ${customer.id}. $5.00 gross payment, with ${referralFee.toFixed(2)} in fees deducted from recipient.`
                            }
                        });
                        logger.info(`Created $5 referral payment for customer ${customer.referredBy.id} (net amount: $${netReferralAmount.toFixed(2)} after Stripe fees)`);
                    }
                }
                // If this is a subscription invoice, update the subscription's next billing date
                if (invoice.subscription && customer.subscription) {
                    await prisma.subscription.update({
                        where: { id: customer.subscription.id },
                        data: {
                            status: 'ACTIVE' // Ensure status is active after successful payment
                        }
                    });
                }
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                // Get the customer from our database
                const customer = await prisma.customer.findUnique({
                    where: { stripeCustomerId: invoice.customer },
                    include: { subscription: true }
                });
                if (!customer) {
                    logger.error(`Customer not found for invoice ${invoice.id}`);
                    break;
                }
                // Create failed payment record
                const payment = await prisma.payment.create({
                    data: {
                        amount: invoice.amount_due / 100, // Convert from cents to dollars
                        status: 'FAILED',
                        type: 'SERVICE',
                        customerId: customer.id,
                        subscriptionId: (_e = customer.subscription) === null || _e === void 0 ? void 0 : _e.id,
                        stripePaymentIntentId: invoice.payment_intent,
                        stripeInvoiceId: invoice.id
                    }
                });
                // Schedule automatic retry for 3 days later
                await prisma.paymentRetry.create({
                    data: {
                        paymentId: payment.id,
                        status: 'SCHEDULED',
                        retryCount: 0,
                        nextRetryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days later
                    }
                });
                // If this is a subscription invoice, update the subscription status
                if (invoice.subscription && customer.subscription) {
                    await prisma.subscription.update({
                        where: { id: customer.subscription.id },
                        data: {
                            status: 'PAST_DUE'
                        }
                    });
                }
                logger.info(`Recorded failed payment for invoice ${invoice.id} and scheduled retry`);
                break;
            }
            case 'invoice.payment_action_required': {
                const invoice = event.data.object;
                // Get the customer from our database
                const customer = await prisma.customer.findUnique({
                    where: { stripeCustomerId: invoice.customer }
                });
                if (!customer) {
                    logger.error(`Customer not found for invoice ${invoice.id}`);
                    break;
                }
                // TODO: Send notification to customer about required action
                // This could be implementing a notification system that sends an email
                logger.info(`Payment action required for invoice ${invoice.id}`);
                break;
            }
        }
        return NextResponse.json({ received: true });
    }
    catch (error) {
        logger.error('Error processing webhook:', error);
        return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
    }
}
