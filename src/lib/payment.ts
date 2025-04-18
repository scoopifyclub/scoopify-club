import { prisma } from '@/lib/prisma';

interface PaymentCalculation {
  subscriptionAmount: number;
  referralAmount: number;
  employeeAmount: number;
  companyAmount: number;
}

export function calculatePaymentSplit(
  subscriptionAmount: number,
  hasReferral: boolean = false
): PaymentCalculation {
  const referralAmount = hasReferral ? 5 : 0;
  const netAmount = subscriptionAmount - referralAmount;
  const employeeAmount = netAmount * 0.75;
  const companyAmount = netAmount - employeeAmount;

  return {
    subscriptionAmount,
    referralAmount,
    employeeAmount,
    companyAmount,
  };
}

export async function createPaymentDistribution(
  subscriptionId: string,
  amount: number,
  employeeId: string,
  referralId?: string
) {
  const hasReferral = !!referralId;
  const split = calculatePaymentSplit(amount, hasReferral);

  // Create the main payment record
  const payment = await prisma.payment.create({
    data: {
      subscriptionId,
      amount: split.subscriptionAmount,
      status: 'COMPLETED',
      type: 'SUBSCRIPTION',
      distributions: {
        create: [
          // Company share
          {
            amount: split.companyAmount,
            type: 'COMPANY',
            status: 'COMPLETED',
          },
          // Employee share
          {
            amount: split.employeeAmount,
            type: 'EMPLOYEE',
            status: 'PENDING',
            employeeId,
          },
          // Referral share (if applicable)
          ...(hasReferral
            ? [
                {
                  amount: split.referralAmount,
                  type: 'REFERRAL',
                  status: 'PENDING',
                  referralId,
                },
              ]
            : []),
        ],
      },
    },
    include: {
      distributions: {
        include: {
          employee: true,
          referral: true,
        },
      },
    },
  });

  // Create earnings record for employee
  await prisma.earning.create({
    data: {
      employeeId,
      amount: split.employeeAmount,
      status: 'PENDING',
      paymentDistributionId: payment.distributions.find(
        d => d.type === 'EMPLOYEE'
      )?.id,
    },
  });

  return payment;
}

export async function getEmployeeEarnings(employeeId: string) {
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