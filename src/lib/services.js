import prisma from '@/lib/prisma';
/**
 * Calculates the potential earnings for a service based on the subscription amount
 * Each subscription covers 4 weekly services, so we divide by 4 and take 75%
 */
export async function calculateServiceEarnings(subscriptionId) {
    const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: {
            payments: {
                where: {
                    type: 'SUBSCRIPTION',
                    status: 'COMPLETED'
                },
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    });
    if (!subscription || !subscription.payments.length) {
        throw new Error('No valid subscription payment found');
    }
    const payment = subscription.payments[0];
    const subscriptionAmount = payment.amount;
    const stripeFee = payment.stripeFee || 0;
    // Check for referral
    const customer = await prisma.customer.findFirst({
        where: { subscriptionId: subscriptionId }
    });
    const referral = customer ? await prisma.referral.findFirst({
        where: {
            referredId: customer.id,
            status: 'ACTIVE'
        }
    }) : null;
    const referralAmount = referral ? 5 : 0; // $5 referral fee if applicable
    // Calculate net amount after fees and referrals
    const netAmount = subscriptionAmount - stripeFee - referralAmount;
    // Calculate per-service amount (75% of net divided by 4 services)
    const perServiceAmount = (netAmount * 0.75) / 4;
    return Math.round(perServiceAmount * 100) / 100; // Round to 2 decimal places
}
/**
 * Creates weekly services for a subscription period with potential earnings
 */
export async function createWeeklyServices(subscriptionId, startDate, endDate) {
    const potentialEarnings = await calculateServiceEarnings(subscriptionId);
    const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { customer: true }
    });
    if (!subscription || !subscription.customer) {
        throw new Error('Invalid subscription or customer');
    }
    // Create 4 weekly services
    const services = [];
    for (let i = 0; i < 4; i++) {
        const serviceDate = new Date(startDate);
        serviceDate.setDate(startDate.getDate() + (i * 7));
        if (serviceDate <= endDate) {
            const service = await prisma.service.create({
                data: {
                    customerId: subscription.customer.id,
                    status: 'SCHEDULED',
                    scheduledDate: serviceDate,
                    servicePlanId: subscription.planId,
                    potentialEarnings: potentialEarnings,
                    paymentStatus: 'PENDING'
                }
            });
            services.push(service);
        }
    }
    return services;
}
/**
 * Approves payment for a completed service
 */
export async function approveServicePayment(serviceId, adminUserId) {
    const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { employee: true }
    });
    if (!service) {
        throw new Error('Service not found');
    }
    if (!service.employeeId) {
        throw new Error('No employee assigned to this service');
    }
    if (service.status !== 'COMPLETED') {
        throw new Error('Service must be completed before approving payment');
    }
    if (service.paymentStatus !== 'PENDING') {
        throw new Error('Invalid payment status for approval');
    }
    // Create earning record and update service status
    await prisma.$transaction([
        prisma.earning.create({
            data: {
                amount: service.potentialEarnings,
                status: 'APPROVED',
                serviceId: service.id,
                employeeId: service.employeeId,
                approvedAt: new Date(),
                approvedBy: adminUserId,
                paidVia: service.employee.cashAppUsername ? 'CASH_APP' : 'STRIPE'
            }
        }),
        prisma.service.update({
            where: { id: service.id },
            data: {
                paymentStatus: 'APPROVED',
                paymentApprovedAt: new Date(),
                paymentApprovedBy: adminUserId
            }
        })
    ]);
    return true;
}
