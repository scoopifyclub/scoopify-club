import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfWeek, endOfWeek, subWeeks } from 'date-fns';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


// This endpoint should be called by a cron job (e.g., Vercel Cron)
// Recommended schedule: Every Friday at 6:00 PM
export async function POST(request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }); // Monday
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }); // Sunday

    console.log(`Processing payouts for week: ${lastWeekStart.toISOString()} to ${lastWeekEnd.toISOString()}`);

    // Get all employees with completed services in the last week
    const employees = await prisma.employee.findMany({
      include: {
        services: {
          where: {
            status: 'COMPLETED',
            completedDate: {
              gte: lastWeekStart,
              lte: lastWeekEnd
            },
            paymentStatus: 'PENDING'
          },
          include: {
            customer: {
              include: {
                user: true
              }
            }
          }
        },
        User: true
      }
    });

    const payoutResults = [];
    const errors = [];

    for (const employee of employees) {
      try {
        if (employee.services.length === 0) {
          console.log(`No completed services for employee ${employee.User.name}`);
          continue;
        }

        const payoutResult = await processEmployeePayout(employee, lastWeekStart, lastWeekEnd);
        payoutResults.push(payoutResult);

      } catch (error) {
        console.error(`Error processing payout for employee ${employee.User.name}:`, error);
        errors.push({
          employeeId: employee.id,
          employeeName: employee.User.name,
          error: error.message
        });
      }
    }

    // Send payout summary report
    await sendPayoutSummaryReport(payoutResults, errors, lastWeekStart, lastWeekEnd);

    return NextResponse.json({
      success: true,
      summary: {
        totalEmployees: employees.length,
        successfulPayouts: payoutResults.filter(r => r.success).length,
        failedPayouts: errors.length,
        totalAmount: payoutResults.reduce((sum, r) => sum + (r.amount || 0), 0)
      },
      results: payoutResults,
      errors: errors
    });

  } catch (error) {
    console.error('Error in employee payout processing:', error);
    return NextResponse.json(
      { error: 'Failed to process employee payouts' },
      { status: 500 }
    );
  }
}

async function processEmployeePayout(employee, weekStart, weekEnd) {
  const completedServices = employee.services;
  const totalEarnings = completedServices.reduce((sum, service) => sum + (service.potentialEarnings || 0), 0);

  if (totalEarnings === 0) {
    return {
      employeeId: employee.id,
      employeeName: employee.User.name,
      success: false,
      reason: 'No earnings to payout',
      amount: 0
    };
  }

  try {
    // Create payout record
    const payout = await prisma.payout.create({
      data: {
        employeeId: employee.id,
        amount: totalEarnings,
        status: 'PENDING',
        weekStart: weekStart,
        weekEnd: weekEnd,
        serviceCount: completedServices.length,
        paymentMethod: 'STRIPE', // Weekly payouts default to Stripe
        isSameDay: false // Weekly payouts are not same-day
      }
    });

    // Weekly payouts default to Stripe for lower fees
    // Employees can request same-day Cash App payouts separately
    const paymentResult = await processStripePayout(employee, totalEarnings, payout.id);

    if (paymentResult.success) {
      // Update payout status
      await prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          transactionId: paymentResult.transactionId
        }
      });

      // Update service payment status
      await prisma.service.updateMany({
        where: {
          id: {
            in: completedServices.map(s => s.id)
          }
        },
        data: {
          paymentStatus: 'PAID',
          paidAt: new Date()
        }
      });

      // Create earnings records
      for (const service of completedServices) {
        await prisma.earning.create({
          data: {
            employeeId: employee.id,
            serviceId: service.id,
            amount: service.potentialEarnings || 0,
            status: 'PAID',
            payoutId: payout.id,
            paidAt: new Date()
          }
        });
      }

      // Send payout notification to employee
      await sendPayoutNotification(employee, totalEarnings, completedServices.length);

      return {
        employeeId: employee.id,
        employeeName: employee.User.name,
        success: true,
        amount: totalEarnings,
        serviceCount: completedServices.length,
        paymentMethod: employee.cashAppUsername ? 'CASH_APP' : 'STRIPE',
        transactionId: paymentResult.transactionId
      };

    } else {
      // Update payout status to failed
      await prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: 'FAILED',
          failureReason: paymentResult.error
        }
      });

      return {
        employeeId: employee.id,
        employeeName: employee.User.name,
        success: false,
        reason: paymentResult.error,
        amount: totalEarnings
      };
    }

  } catch (error) {
    console.error(`Error processing payout for ${employee.User.name}:`, error);
    throw error;
  }
}

async function processCashAppPayout(employee, amount, payoutId) {
  try {
    // This would integrate with Cash App's API
    // For now, we'll simulate a successful payment
    
    console.log(`Processing Cash App payout of $${amount} to ${employee.cashAppUsername}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a mock transaction ID
    const transactionId = `cashapp_${Date.now()}_${employee.id}`;
    
    return {
      success: true,
      transactionId: transactionId
    };
    
  } catch (error) {
    console.error('Cash App payout error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function processStripePayout(employee, amount, payoutId) {
  try {
    // This would integrate with Stripe's payout API
    // For now, we'll simulate a successful payment
    
    console.log(`Processing Stripe payout of $${amount} to employee ${employee.id}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a mock transaction ID
    const transactionId = `stripe_${Date.now()}_${employee.id}`;
    
    return {
      success: true,
      transactionId: transactionId
    };
    
  } catch (error) {
    console.error('Stripe payout error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function sendPayoutNotification(employee, amount, serviceCount) {
  try {
    // Create notification for employee
    await prisma.notification.create({
      data: {
        userId: employee.userId,
        type: 'PAYOUT_COMPLETED',
        title: 'Payout Completed',
        message: `Your weekly payout of $${amount.toFixed(2)} for ${serviceCount} services has been processed.`,
        metadata: {
          amount: amount,
          serviceCount: serviceCount,
          weekStart: new Date().toISOString()
        }
      }
    });

    // This would also integrate with email/SMS notifications
    console.log(`Sent payout notification to ${employee.User.email}`);
    
  } catch (error) {
    console.error('Error sending payout notification:', error);
  }
}

async function sendPayoutSummaryReport(payoutResults, errors, weekStart, weekEnd) {
  try {
    const successfulPayouts = payoutResults.filter(r => r.success);
    const totalAmount = successfulPayouts.reduce((sum, r) => sum + (r.amount || 0), 0);
    
    console.log('=== Weekly Payout Summary Report ===');
    console.log(`Week: ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`);
    console.log(`Total Payouts: ${successfulPayouts.length}`);
    console.log(`Total Amount: $${totalAmount.toFixed(2)}`);
    console.log(`Failed Payouts: ${errors.length}`);
    
    if (successfulPayouts.length > 0) {
      console.log('\nSuccessful Payouts:');
      successfulPayouts.forEach(payout => {
        console.log(`- ${payout.employeeName}: $${payout.amount.toFixed(2)} (${payout.serviceCount} services)`);
      });
    }
    
    if (errors.length > 0) {
      console.log('\nFailed Payouts:');
      errors.forEach(error => {
        console.log(`- ${error.employeeName}: ${error.error}`);
      });
    }
    
    // This would integrate with your email service to send to admin
    // await sendEmail({
    //   to: 'admin@scoopify.club',
    //   subject: 'Weekly Payout Summary',
    //   template: 'payout-summary',
    //   data: { payoutResults, errors, weekStart, weekEnd }
    // });
    
  } catch (error) {
    console.error('Error sending payout summary report:', error);
  }
} 