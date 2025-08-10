import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


// This endpoint should be called by a cron job (e.g., Vercel Cron)
// Recommended schedule: Every Monday at 2:00 AM
export async function POST(request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting weekly payment reconciliation...');

    const now = new Date();
    const lastWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekEnd = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. Reconcile employee payouts
    const payoutReconciliation = await reconcileEmployeePayouts(lastWeekStart, lastWeekEnd);

    // 2. Reconcile customer payments
    const customerPaymentReconciliation = await reconcileCustomerPayments(lastWeekStart, lastWeekEnd);

    // 3. Reconcile service payments
    const servicePaymentReconciliation = await reconcileServicePayments(lastWeekStart, lastWeekEnd);

    // 4. Generate reconciliation report
    const reconciliationReport = {
      period: {
        start: lastWeekStart.toISOString(),
        end: lastWeekEnd.toISOString()
      },
      employeePayouts: payoutReconciliation,
      customerPayments: customerPaymentReconciliation,
      servicePayments: servicePaymentReconciliation,
      summary: {
        totalEmployeePayouts: payoutReconciliation.totalAmount,
        totalCustomerPayments: customerPaymentReconciliation.totalAmount,
        totalServicePayments: servicePaymentReconciliation.totalAmount,
        netRevenue: customerPaymentReconciliation.totalAmount - payoutReconciliation.totalAmount,
        discrepancies: [
          ...payoutReconciliation.discrepancies,
          ...customerPaymentReconciliation.discrepancies,
          ...servicePaymentReconciliation.discrepancies
        ]
      }
    };

    // 5. Save reconciliation report
    await saveReconciliationReport(reconciliationReport);

    // 6. Send admin notification if there are discrepancies
    if (reconciliationReport.summary.discrepancies.length > 0) {
      await sendReconciliationAlert(reconciliationReport);
    }

    console.log('✅ Payment reconciliation completed successfully');

    return NextResponse.json({
      success: true,
      report: reconciliationReport
    });

  } catch (error) {
    console.error('❌ Error in payment reconciliation:', error);
    return NextResponse.json(
      { error: 'Failed to process payment reconciliation' },
      { status: 500 }
    );
  }
}

async function reconcileEmployeePayouts(startDate, endDate) {
  try {
    // Get all payouts for the period
    const payouts = await prisma.payout.findMany({
      where: {
        requestedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        employee: {
          include: {
            User: true
          }
        }
      }
    });

    // Get earnings for the period
    const earnings = await prisma.earning.findMany({
      where: {
        paidAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        service: true,
        employee: {
          include: {
            User: true
          }
        }
      }
    });

    const totalPayoutAmount = payouts.reduce((sum, payout) => sum + payout.amount, 0);
    const totalEarningsAmount = earnings.reduce((sum, earning) => sum + earning.amount, 0);

    const discrepancies = [];
    if (Math.abs(totalPayoutAmount - totalEarningsAmount) > 0.01) {
      discrepancies.push({
        type: 'PAYOUT_EARNINGS_MISMATCH',
        description: `Payout total (${totalPayoutAmount}) doesn't match earnings total (${totalEarningsAmount})`,
        difference: totalPayoutAmount - totalEarningsAmount
      });
    }

    return {
      totalAmount: totalPayoutAmount,
      payoutCount: payouts.length,
      earningsCount: earnings.length,
      discrepancies
    };

  } catch (error) {
    console.error('Error reconciling employee payouts:', error);
    return {
      totalAmount: 0,
      payoutCount: 0,
      earningsCount: 0,
      discrepancies: [{
        type: 'RECONCILIATION_ERROR',
        description: 'Failed to reconcile employee payouts',
        error: error.message
      }]
    };
  }
}

async function reconcileCustomerPayments(startDate, endDate) {
  try {
    // Get all customer payments for the period
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        type: 'SUBSCRIPTION'
      },
      include: {
        customer: {
          include: {
            user: true
          }
        }
      }
    });

    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const successfulPayments = payments.filter(p => p.status === 'COMPLETED');
    const failedPayments = payments.filter(p => p.status === 'FAILED');

    const discrepancies = [];
    if (failedPayments.length > 0) {
      discrepancies.push({
        type: 'FAILED_PAYMENTS',
        description: `${failedPayments.length} failed payments detected`,
        failedAmount: failedPayments.reduce((sum, p) => sum + p.amount, 0)
      });
    }

    return {
      totalAmount,
      paymentCount: payments.length,
      successfulCount: successfulPayments.length,
      failedCount: failedPayments.length,
      discrepancies
    };

  } catch (error) {
    console.error('Error reconciling customer payments:', error);
    return {
      totalAmount: 0,
      paymentCount: 0,
      successfulCount: 0,
      failedCount: 0,
      discrepancies: [{
        type: 'RECONCILIATION_ERROR',
        description: 'Failed to reconcile customer payments',
        error: error.message
      }]
    };
  }
}

async function reconcileServicePayments(startDate, endDate) {
  try {
    // Get all services for the period
    const services = await prisma.service.findMany({
      where: {
        completedDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        customer: {
          include: {
            user: true
          }
        },
        employee: {
          include: {
            User: true
          }
        }
      }
    });

    const completedServices = services.filter(s => s.status === 'COMPLETED');
    const paidServices = completedServices.filter(s => s.paymentStatus === 'PAID');
    const pendingServices = completedServices.filter(s => s.paymentStatus === 'PENDING');

    const totalServiceValue = completedServices.reduce((sum, service) => 
      sum + (service.potentialEarnings || 0), 0
    );

    const discrepancies = [];
    if (pendingServices.length > 0) {
      discrepancies.push({
        type: 'PENDING_SERVICE_PAYMENTS',
        description: `${pendingServices.length} completed services with pending payments`,
        pendingAmount: pendingServices.reduce((sum, s) => sum + (s.potentialEarnings || 0), 0)
      });
    }

    return {
      totalAmount: totalServiceValue,
      totalServices: services.length,
      completedServices: completedServices.length,
      paidServices: paidServices.length,
      pendingServices: pendingServices.length,
      discrepancies
    };

  } catch (error) {
    console.error('Error reconciling service payments:', error);
    return {
      totalAmount: 0,
      totalServices: 0,
      completedServices: 0,
      paidServices: 0,
      pendingServices: 0,
      discrepancies: [{
        type: 'RECONCILIATION_ERROR',
        description: 'Failed to reconcile service payments',
        error: error.message
      }]
    };
  }
}

async function saveReconciliationReport(report) {
  try {
    await prisma.paymentReconciliationReport.create({
      data: {
        periodStart: report.period.start,
        periodEnd: report.period.end,
        employeePayoutsTotal: report.employeePayouts.totalAmount,
        customerPaymentsTotal: report.customerPayments.totalAmount,
        servicePaymentsTotal: report.servicePayments.totalAmount,
        netRevenue: report.summary.netRevenue,
        discrepancyCount: report.summary.discrepancies.length,
        reportData: report
      }
    });

    console.log('✅ Reconciliation report saved to database');

  } catch (error) {
    console.error('Error saving reconciliation report:', error);
  }
}

async function sendReconciliationAlert(report) {
  try {
    // Create notification for admin
    await prisma.notification.create({
      data: {
        userId: 'admin', // You'll need to set up admin user ID
        type: 'RECONCILIATION_ALERT',
        title: 'Payment Reconciliation Alert',
        message: `Weekly reconciliation found ${report.summary.discrepancies.length} discrepancies. Please review the report.`,
        metadata: {
          discrepancyCount: report.summary.discrepancies.length,
          netRevenue: report.summary.netRevenue,
          period: report.period
        }
      }
    });

    console.log('✅ Reconciliation alert sent to admin');

  } catch (error) {
    console.error('Error sending reconciliation alert:', error);
  }
} 