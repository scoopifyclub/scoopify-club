import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

/**
 * Create a Stripe Connect account for an employee
 */
export async function createEmployeeConnectAccount(employee, bankAccountInfo) {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: employee.User.email,
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: false },
      },
      business_type: 'individual',
      individual: {
        first_name: employee.User.name.split(' ')[0] || '',
        last_name: employee.User.name.split(' ').slice(1).join(' ') || '',
        email: employee.User.email,
        phone: employee.phone || '',
      },
      business_profile: {
        url: 'https://scoopify.club',
        mcc: '7399', // Business Services - Not Elsewhere Classified
      },
    });

    // Update employee record with Stripe Connect account ID
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        stripeConnectAccountId: account.id,
        stripeAccountStatus: account.charges_enabled ? 'ACTIVE' : 'PENDING'
      }
    });

    return account;
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    throw error;
  }
}

/**
 * Create an account link for employee onboarding
 */
export async function createAccountLink(employeeId) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { User: true }
    });

    if (!employee.stripeConnectAccountId) {
      throw new Error('Employee does not have a Stripe Connect account');
    }

    const accountLink = await stripe.accountLinks.create({
      account: employee.stripeConnectAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/employee/dashboard/profile?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/employee/dashboard/profile?success=true`,
      type: 'account_onboarding',
    });

    return accountLink;
  } catch (error) {
    console.error('Error creating account link:', error);
    throw error;
  }
}

/**
 * Process a payout to an employee via Stripe Connect
 */
export async function processStripePayout(employee, amount, payoutId) {
  try {
    if (!employee.stripeConnectAccountId) {
      throw new Error('Employee does not have a Stripe Connect account set up');
    }

    // Create a transfer to the employee's Connect account
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      destination: employee.stripeConnectAccountId,
      description: `Payout for services - Payout ID: ${payoutId}`,
      metadata: {
        payoutId: payoutId,
        employeeId: employee.id,
        employeeName: employee.User.name
      }
    });

    return {
      success: true,
      transactionId: transfer.id,
      transfer: transfer
    };
  } catch (error) {
    console.error('Error processing Stripe payout:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get employee's payout balance
 */
export async function getEmployeeBalance(employeeId) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { User: true }
    });

    if (!employee.stripeConnectAccountId) {
      return { available: 0, pending: 0 };
    }

    const balance = await stripe.balance.retrieve({
      stripeAccount: employee.stripeConnectAccountId,
    });

    const available = balance.available.reduce((sum, bal) => sum + bal.amount, 0) / 100;
    const pending = balance.pending.reduce((sum, bal) => sum + bal.amount, 0) / 100;

    return { available, pending };
  } catch (error) {
    console.error('Error getting employee balance:', error);
    return { available: 0, pending: 0 };
  }
}

/**
 * Get employee's payout history
 */
export async function getEmployeePayoutHistory(employeeId) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { User: true }
    });

    if (!employee.stripeConnectAccountId) {
      return [];
    }

    const payouts = await stripe.payouts.list({
      stripeAccount: employee.stripeConnectAccountId,
      limit: 50,
    });

    return payouts.data.map(payout => ({
      id: payout.id,
      amount: payout.amount / 100,
      currency: payout.currency,
      status: payout.status,
      arrival_date: payout.arrival_date,
      created: payout.created,
      type: payout.type
    }));
  } catch (error) {
    console.error('Error getting employee payout history:', error);
    return [];
  }
}

/**
 * Check if employee's Stripe Connect account is ready for payouts
 */
export async function checkEmployeeAccountStatus(employeeId) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { User: true }
    });

    if (!employee.stripeConnectAccountId) {
      return {
        hasAccount: false,
        isReady: false,
        status: 'NO_ACCOUNT',
        message: 'Employee needs to set up Stripe Connect account'
      };
    }

    const account = await stripe.accounts.retrieve(employee.stripeConnectAccountId);

    const isReady = account.charges_enabled && 
                   account.payouts_enabled && 
                   account.details_submitted;

    return {
      hasAccount: true,
      isReady: isReady,
      status: account.charges_enabled ? 'ACTIVE' : 'PENDING',
      message: isReady ? 'Account ready for payouts' : 'Account setup incomplete',
      account: account
    };
  } catch (error) {
    console.error('Error checking employee account status:', error);
    return {
      hasAccount: false,
      isReady: false,
      status: 'ERROR',
      message: 'Error checking account status'
    };
  }
}

/**
 * Create a payout from employee's balance to their bank account
 */
export async function createEmployeePayout(employeeId, amount) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { User: true }
    });

    if (!employee.stripeConnectAccountId) {
      throw new Error('Employee does not have a Stripe Connect account');
    }

    const payout = await stripe.payouts.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      stripeAccount: employee.stripeConnectAccountId,
      metadata: {
        employeeId: employee.id,
        employeeName: employee.User.name
      }
    });

    return {
      success: true,
      payoutId: payout.id,
      amount: payout.amount / 100,
      status: payout.status,
      arrivalDate: payout.arrival_date
    };
  } catch (error) {
    console.error('Error creating employee payout:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get account requirements for employee onboarding
 */
export async function getAccountRequirements(employeeId) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { User: true }
    });

    if (!employee.stripeConnectAccountId) {
      return {
        requirements: [],
        isComplete: false
      };
    }

    const account = await stripe.accounts.retrieve(employee.stripeConnectAccountId);

    return {
      requirements: account.requirements || [],
      isComplete: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    };
  } catch (error) {
    console.error('Error getting account requirements:', error);
    return {
      requirements: [],
      isComplete: false
    };
  }
} 