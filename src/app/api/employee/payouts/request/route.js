import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/api-auth';

export async function POST(request) {
  const { userId } = getUserFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { paymentMethod, amount, serviceIds } = await request.json();

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { userId },
      include: {
        User: true
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Validate payment method
    if (!['STRIPE', 'CASH_APP'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    // If Cash App, validate username is set
    if (paymentMethod === 'CASH_APP' && !employee.cashAppUsername) {
      return NextResponse.json({ 
        error: 'Cash App username not set. Please update your profile first.' 
      }, { status: 400 });
    }

    // Get pending services for this employee
    const pendingServices = await prisma.service.findMany({
      where: {
        id: {
          in: serviceIds || []
        },
        employeeId: employee.id,
        status: 'COMPLETED',
        paymentStatus: 'PENDING'
      }
    });

    if (pendingServices.length === 0) {
      return NextResponse.json({ 
        error: 'No pending services found for payout' 
      }, { status: 400 });
    }

    // Calculate total earnings
    const totalEarnings = pendingServices.reduce((sum, service) => 
      sum + (service.potentialEarnings || 0), 0
    );

    // Calculate fees based on payment method
    let fees = 0;
    let netAmount = totalEarnings;

    if (paymentMethod === 'CASH_APP') {
      // Cash App fees: $0.25 per transaction + 1.5% of amount
      fees = 0.25 + (totalEarnings * 0.015);
      netAmount = totalEarnings - fees;
    } else {
      // Stripe fees: 0.25% + $0.25 per payout (much lower for direct deposits)
      fees = 0.25 + (totalEarnings * 0.0025);
      netAmount = totalEarnings - fees;
    }

    // Create payout request
    const payout = await prisma.payout.create({
      data: {
        employeeId: employee.id,
        amount: totalEarnings,
        fees: fees,
        netAmount: netAmount,
        status: 'PENDING',
        paymentMethod: paymentMethod,
        serviceCount: pendingServices.length,
        requestedAt: new Date(),
        isSameDay: paymentMethod === 'CASH_APP'
      }
    });

    // Process payment based on method
    let paymentResult;
    if (paymentMethod === 'CASH_APP') {
      paymentResult = await processCashAppPayout(employee, netAmount, payout.id);
    } else {
      paymentResult = await processStripePayout(employee, netAmount, payout.id);
    }

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
            in: pendingServices.map(s => s.id)
          }
        },
        data: {
          paymentStatus: 'PAID',
          paidAt: new Date(),
          payoutId: payout.id
        }
      });

      // Create earnings records
      for (const service of pendingServices) {
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

      // Send notification to employee
      await sendPayoutNotification(employee, netAmount, pendingServices.length, paymentMethod);

      return NextResponse.json({
        success: true,
        message: `Payout of $${netAmount.toFixed(2)} processed successfully`,
        payout: {
          id: payout.id,
          amount: totalEarnings,
          fees: fees,
          netAmount: netAmount,
          paymentMethod: paymentMethod,
          transactionId: paymentResult.transactionId
        }
      });

    } else {
      // Update payout status to failed
      await prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: 'FAILED',
          failureReason: paymentResult.error
        }
      });

      return NextResponse.json({
        success: false,
        error: paymentResult.error
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error processing payout request:', error);
    return NextResponse.json(
      { error: 'Failed to process payout request' },
      { status: 500 }
    );
  }
}

async function processCashAppPayout(employee, amount, payoutId) {
  try {
    // This would integrate with Cash App's API
    console.log(`Processing Cash App payout of $${amount} to ${employee.cashAppUsername}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
    // Import the Stripe Connect utility
    const { processStripePayout: processStripePayoutUtil } = await import('@/lib/stripe-connect');
    
    // Use the real Stripe Connect payout function
    const result = await processStripePayoutUtil(employee, amount, payoutId);
    
    return result;
    
  } catch (error) {
    console.error('Stripe payout error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function sendPayoutNotification(employee, amount, serviceCount, paymentMethod) {
  try {
    const methodText = paymentMethod === 'CASH_APP' ? 'Cash App' : 'direct deposit';
    
    await prisma.notification.create({
      data: {
        userId: employee.userId,
        type: 'PAYOUT_COMPLETED',
        title: 'Payout Completed',
        message: `Your payout of $${amount.toFixed(2)} for ${serviceCount} services has been sent via ${methodText}.`,
        metadata: {
          amount: amount,
          serviceCount: serviceCount,
          paymentMethod: paymentMethod
        }
      }
    });

    console.log(`Sent payout notification to ${employee.User.email}`);
    
  } catch (error) {
    console.error('Error sending payout notification:', error);
  }
} 