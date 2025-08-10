import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/api-auth';
import { 
  createEmployeeConnectAccount, 
  createAccountLink, 
  checkEmployeeAccountStatus,
  getAccountRequirements 
} from '@/lib/stripe-connect';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
  const { userId } = getUserFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

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

    switch (action) {
      case 'status':
        // Check account status
        const status = await checkEmployeeAccountStatus(employee.id);
        return NextResponse.json(status);

      case 'requirements':
        // Get account requirements
        const requirements = await getAccountRequirements(employee.id);
        return NextResponse.json(requirements);

      case 'onboarding-link':
        // Create or get onboarding link
        if (!employee.stripeConnectAccountId) {
          // Create new Connect account
          await createEmployeeConnectAccount(employee);
        }
        
        const accountLink = await createAccountLink(employee.id);
        return NextResponse.json({
          url: accountLink.url,
          expiresAt: accountLink.expires_at
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in Stripe Connect API:', error);
    return NextResponse.json(
      { error: 'Failed to process Stripe Connect request' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { userId } = getUserFromToken(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action } = await request.json();

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

    switch (action) {
      case 'create-account':
        // Create new Stripe Connect account
        const account = await createEmployeeConnectAccount(employee);
        return NextResponse.json({
          success: true,
          accountId: account.id,
          status: account.charges_enabled ? 'ACTIVE' : 'PENDING'
        });

      case 'refresh-status':
        // Refresh account status
        const status = await checkEmployeeAccountStatus(employee.id);
        
        // Update employee record with new status
        if (employee.stripeConnectAccountId) {
          await prisma.employee.update({
            where: { id: employee.id },
            data: {
              stripeAccountStatus: status.status
            }
          });
        }
        
        return NextResponse.json(status);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in Stripe Connect API:', error);
    return NextResponse.json(
      { error: 'Failed to process Stripe Connect request' },
      { status: 500 }
    );
  }
}
