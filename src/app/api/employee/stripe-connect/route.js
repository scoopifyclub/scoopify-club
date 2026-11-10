import { NextResponse } from 'next/server';
import { requireScooper } from '@/lib/job-claims';
import { createDashboardLink, createOnboardingLink, refreshConnectStatus } from '@/lib/stripe-connect';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function appBaseUrl(request) {
  return (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, '');
}

function statusBody(employee, synced) {
  return {
    hasStripeAccount: Boolean(employee.stripeConnectAccountId),
    stripeAccountStatus: synced?.status || (employee.stripeConnectAccountId ? employee.stripeAccountStatus || 'PENDING' : 'NO_ACCOUNT'),
    payoutsEnabled: synced ? synced.payoutsEnabled : Boolean(employee.stripePayoutsEnabled),
    detailsSubmitted: synced ? synced.detailsSubmitted : Boolean(employee.stripeDetailsSubmitted),
  };
}

async function onboardingLink(request, employee) {
  const { url } = await createOnboardingLink(employee.id, { baseUrl: appBaseUrl(request) });
  return NextResponse.json({ success: true, url, onboardingUrl: url });
}

// GET ?action=status            stored Connect status (any scooper)
// GET ?action=onboarding-link   Stripe-hosted onboarding link (approved scoopers)
export async function GET(request) {
  const action = new URL(request.url).searchParams.get('action') || 'status';
  const auth = await requireScooper(request, { requireApproval: action !== 'status' });
  if (!auth.ok) return auth.response;

  try {
    if (action === 'status') return NextResponse.json(statusBody(auth.employee));
    if (action === 'onboarding-link') return await onboardingLink(request, auth.employee);
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Stripe Connect error:', error);
    return NextResponse.json({ error: 'Failed to process Stripe Connect request' }, { status: 500 });
  }
}

// POST { action: 'create-account' | 'onboarding-link' }  start or resume onboarding
// POST { action: 'refresh-status' }                      re-read the account from Stripe
// POST { action: 'dashboard-link' }                      Stripe Express dashboard login
export async function POST(request) {
  const { action } = await request.json().catch(() => ({}));
  const auth = await requireScooper(request, { requireApproval: action !== 'refresh-status' });
  if (!auth.ok) return auth.response;
  const { employee } = auth;

  try {
    if (action === 'create-account' || action === 'onboarding-link') return await onboardingLink(request, employee);
    if (action === 'refresh-status') {
      const synced = await refreshConnectStatus(employee);
      return NextResponse.json(statusBody(employee, synced.status === 'NO_ACCOUNT' ? null : synced));
    }
    if (action === 'dashboard-link') {
      if (!employee.stripeConnectAccountId || !employee.stripeDetailsSubmitted) {
        return NextResponse.json({ error: 'Finish Stripe onboarding first' }, { status: 409 });
      }
      return NextResponse.json({ success: true, url: await createDashboardLink(employee.stripeConnectAccountId) });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Stripe Connect error:', error);
    return NextResponse.json({ error: 'Failed to process Stripe Connect request' }, { status: 500 });
  }
}
