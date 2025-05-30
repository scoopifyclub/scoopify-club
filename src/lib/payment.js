import prisma from "@/lib/prisma";
/**
 * Calculate payment distribution according to business rules:
 * - Stripe fees are deducted first
 * - Referral fees come off the top (if applicable)
 * - Employee gets 75% of the remaining amount
 * - Company keeps 25% of the remaining amount
 */
export function calculatePaymentDistribution(totalAmount, stripeFeePercent = 2.9, stripeFeeFixed = 0.30, referralAmount = 0) {
    // Calculate Stripe fee
    const stripeFee = (totalAmount * (stripeFeePercent / 100)) + stripeFeeFixed;
    // Deduct Stripe fee
    const amountAfterStripeFee = totalAmount - stripeFee;
    // Deduct referral amount if any
    const amountAfterReferral = amountAfterStripeFee - referralAmount;
    // Calculate split (employee: 75%, company: 25%)
    const employeeAmount = amountAfterReferral * 0.75;
    const companyAmount = amountAfterReferral * 0.25;
    return {
        totalAmount,
        stripeFee,
        referralAmount,
        amountAfterFees: amountAfterReferral,
        employeeAmount,
        companyAmount
    };
}
/**
 * Process payment distribution for a service
 * Handles creating payment records, earnings, and referral payments
 */
export async function processServicePayment(serviceId, amount, stripeFee) {
    // Get the service with related data
    const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: {
            customer: {
                include: {
                    user: true
                }
            },
            employee: true
        }
    });
    if (!service) {
        throw new Error('Service not found');
    }
    if (!service.employee) {
        throw new Error('Cannot process payment - no employee assigned to this service');
    }
    // Check for referral
    const referral = await prisma.referral.findFirst({
        where: {
            referredId: service.customer.userId,
            status: 'ACTIVE'
        },
        include: {
            referrer: true
        }
    });
    const referralAmount = referral ? 5 : 0; // $5 fixed referral fee
    // Calculate payment distribution
    const distribution = calculatePaymentDistribution(amount, stripeFee > 0 ? (stripeFee / amount) * 100 : 2.9, // Use actual fee percent if provided
    0.30, referralAmount);
    // Create payment record
    const payment = await prisma.payment.create({
        data: {
            amount: distribution.totalAmount,
            stripeFee: distribution.stripeFee,
            status: 'COMPLETED',
            type: 'SERVICE',
            serviceId: service.id,
            employeeId: service.employee.id,
            customerId: service.customer.id
        }
    });
    // Create employee earnings record
    const earning = await prisma.earning.create({
        data: {
            amount: distribution.employeeAmount,
            status: 'PENDING',
            paymentId: payment.id,
            employeeId: service.employee.id,
            serviceId: service.id
        }
    });
    // Process referral payment if applicable
    let referralPayment = null;
    if (referral) {
        referralPayment = await prisma.payment.create({
            data: {
                amount: distribution.referralAmount,
                status: 'COMPLETED',
                type: 'REFERRAL',
                customerId: referral.referrerId,
                referredId: service.customer.userId
            }
        });
    }
    // Update service payment status
    await prisma.service.update({
        where: { id: serviceId },
        data: {
            paymentStatus: 'PAID'
        }
    });
    return {
        payment,
        earning,
        referralPayment,
        distribution
    };
}
/**
 * Process monthly referral payments for all active referrals
 * Gives $5 to each user for each customer they've referred that's still active
 */
export async function processMonthlyReferralPayments() {
    var _a, _b;
    // Get all active referrals
    const activeReferrals = await prisma.referral.findMany({
        where: {
            status: 'ACTIVE',
            referred: {
                subscription: {
                    status: 'ACTIVE'
                }
            }
        },
        include: {
            referrer: true,
            referred: {
                include: {
                    subscription: true
                }
            }
        }
    });
    const results = {
        processedCount: 0,
        totalAmount: 0,
        referralPayments: []
    };
    // Cap referral payouts at 12 months from subscription start
    const now = new Date();
    for (const referral of activeReferrals) {
        try {
            const subscription = referral.referred?.subscription;
            if (!subscription || !subscription.startDate) continue;
            const startDate = new Date(subscription.startDate);
            const monthsSinceStart = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
            if (monthsSinceStart >= 12) continue; // Cap at 12 months

            // Only pay if subscription is still active and within 12 months
            const payment = await prisma.payment.create({
                data: {
                    amount: 5, // $5 fixed monthly referral fee
                    status: 'APPROVED', // Mark as approved for batch payout
                    type: 'MONTHLY_REFERRAL',
                    customerId: referral.referrerId,
                    referredId: referral.referredId,
                    notes: `Monthly referral payment for ${((_a = referral.referred.user) === null || _a === void 0 ? void 0 : _a.name) || 'customer'} (month ${monthsSinceStart + 1}/12)`
                }
            });
            results.processedCount++;
            results.totalAmount += 5;
            results.referralPayments.push({
                referralId: referral.id,
                paymentId: payment.id,
                referrerId: referral.referrerId,
                referrerName: (_b = referral.referrer.user) === null || _b === void 0 ? void 0 : _b.name,
                amount: 5,
                month: monthsSinceStart + 1
            });
        } catch (error) {
            console.error(`Error processing referral payment for referral ${referral.id}:`, error);
        }
    }
    return results;
}
export async function getEmployeeEarnings(employeeId) {
    const earnings = await prisma.earning.findMany({
        where: { employeeId },
        include: {
            paymentDistribution: {
                include: {
                    payment: {
                        include: {
                            subscription: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    const stats = {
        totalEarned: earnings
            .filter(e => e.status === 'PAID')
            .reduce((sum, e) => sum + e.amount, 0),
        pendingAmount: earnings
            .filter(e => e.status === 'PENDING')
            .reduce((sum, e) => sum + e.amount, 0),
        totalJobs: earnings.length,
    };
    return {
        earnings,
        stats,
    };
}
