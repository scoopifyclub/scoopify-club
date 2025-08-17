import { NextResponse } from 'next/server';
import { getAuthUserFromCookies } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function GET(request) {
  const user = await getAuthUserFromCookies(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: user.id },
      include: { user: true }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    if (action === 'status') {
      return NextResponse.json({
        hasStripeAccount: !!employee.stripeConnectAccountId,
        stripeAccountId: employee.stripeConnectAccountId,
        stripeAccountStatus: employee.stripeAccountStatus || 'PENDING',
        email: employee.user.email,
        name: employee.user.name
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error fetching Stripe status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Stripe status' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const user = await getAuthUserFromCookies(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action } = await request.json();

    if (action === 'create-account') {
      const employee = await prisma.employee.findUnique({
        where: { userId: user.id },
        include: { user: true }
      });

      if (!employee) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }

      // Create Stripe Connect account
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: employee.user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        individual: {
          email: employee.user.email,
          first_name: employee.user.name.split(' ')[0] || '',
          last_name: employee.user.name.split(' ').slice(1).join(' ') || '',
        },
      });

      // Update employee record
      await prisma.employee.update({
        where: { id: employee.id },
        data: {
          stripeConnectAccountId: account.id,
          stripeAccountStatus: 'PENDING'
        }
      });

      return NextResponse.json({
        success: true,
        accountId: account.id,
        onboardingUrl: account.charges_enabled ? null : account.charges_enabled
      });

    } else if (action === 'onboarding-link') {
      const employee = await prisma.employee.findUnique({
        where: { userId: user.id }
      });

      if (!employee?.stripeConnectAccountId) {
        return NextResponse.json({ error: 'No Stripe account found' }, { status: 404 });
      }

      const link = await stripe.accountLinks.create({
        account: employee.stripeConnectAccountId,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/employee/dashboard`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/employee/dashboard`,
        type: 'account_onboarding',
      });

      return NextResponse.json({
        success: true,
        onboardingUrl: link.url
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error with Stripe Connect:', error);
    return NextResponse.json(
      { error: 'Failed to process Stripe Connect request' },
      { status: 500 }
    );
  }
}
