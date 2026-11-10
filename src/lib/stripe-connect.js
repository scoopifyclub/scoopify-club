import Stripe from 'stripe';
import { prisma as defaultDb } from '@/lib/prisma';

let client;

/** Server-side Stripe client, created on first use so builds without keys still load. */
export function getStripe() {
  if (!client) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set');
    client = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
  }
  return client;
}

export function isLiveStripeKey() {
  return (process.env.STRIPE_SECRET_KEY || '').startsWith('sk_live_') ||
    (process.env.STRIPE_SECRET_KEY || '').startsWith('rk_live_');
}

/**
 * Express accounts receive transfers only. A scooper can be paid when Stripe
 * reports payouts enabled and the transfers capability active.
 */
export function connectStatusFromAccount(account) {
  const transfersActive = account?.capabilities?.transfers === 'active';
  const payoutsEnabled = Boolean(account?.payouts_enabled);
  const detailsSubmitted = Boolean(account?.details_submitted);
  let status = 'PENDING';
  if (payoutsEnabled && transfersActive) status = 'ACTIVE';
  else if (detailsSubmitted) status = 'RESTRICTED';
  return { status, payoutsEnabled, detailsSubmitted, transfersActive };
}

export function canReceiveTransfers(employee) {
  return Boolean(employee?.stripeConnectAccountId && employee.stripePayoutsEnabled && employee.stripeAccountStatus === 'ACTIVE');
}

/** Stores what Stripe says about a connected account (account.updated webhook or a return-page refresh). */
export async function syncConnectAccount(account, { db = defaultDb, now = new Date() } = {}) {
  const { status, payoutsEnabled, detailsSubmitted } = connectStatusFromAccount(account);
  const { count } = await db.employee.updateMany({
    where: { stripeConnectAccountId: account.id },
    data: {
      stripeAccountStatus: status,
      stripePayoutsEnabled: payoutsEnabled,
      stripeDetailsSubmitted: detailsSubmitted,
      stripeAccountUpdatedAt: now,
    },
  });
  return { updated: count, status, payoutsEnabled, detailsSubmitted };
}

/**
 * Returns the scooper's Express account id, creating the account once. The
 * Stripe idempotency key and the conditional update keep two concurrent
 * clicks from leaving the scooper with two accounts.
 */
export async function ensureConnectAccount(employeeId, { db = defaultDb, stripe = getStripe() } = {}) {
  const employee = await db.employee.findUnique({ where: { id: employeeId }, include: { user: true } });
  if (!employee) throw new Error('Employee not found');
  if (employee.stripeConnectAccountId) return employee.stripeConnectAccountId;

  const account = await stripe.accounts.create(
    {
      type: 'express',
      country: 'US',
      email: employee.user?.email || undefined,
      business_type: 'individual',
      capabilities: { transfers: { requested: true } },
      individual: {
        first_name: employee.user?.firstName || undefined,
        last_name: employee.user?.lastName || undefined,
        email: employee.user?.email || undefined,
      },
      business_profile: { url: 'https://scoopify.club', mcc: '7349', product_description: 'Pet waste removal contractor for Scoopify Club' },
      metadata: { employeeId: employee.id },
    },
    { idempotencyKey: `connect-account-${employee.id}` }
  );

  await db.employee.updateMany({
    where: { id: employee.id, stripeConnectAccountId: null },
    data: { stripeConnectAccountId: account.id, stripeAccountStatus: 'PENDING', stripeAccountUpdatedAt: new Date() },
  });
  const saved = await db.employee.findUnique({ where: { id: employee.id }, select: { stripeConnectAccountId: true } });
  return saved.stripeConnectAccountId;
}

/** One-time Stripe-hosted onboarding link; expires after a few minutes, so create it on click. */
export async function createOnboardingLink(employeeId, { baseUrl, db = defaultDb, stripe = getStripe() } = {}) {
  const accountId = await ensureConnectAccount(employeeId, { db, stripe });
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/employee/dashboard/payouts/refresh`,
    return_url: `${baseUrl}/employee/dashboard/payouts/return`,
    type: 'account_onboarding',
  });
  return { url: link.url, accountId };
}

/** Express dashboard login link, where the scooper sees Stripe payouts to their bank. */
export async function createDashboardLink(accountId, { stripe = getStripe() } = {}) {
  const link = await stripe.accounts.createLoginLink(accountId);
  return link.url;
}

export async function refreshConnectStatus(employee, { db = defaultDb, stripe = getStripe() } = {}) {
  if (!employee.stripeConnectAccountId) {
    return { status: 'NO_ACCOUNT', payoutsEnabled: false, detailsSubmitted: false };
  }
  const account = await stripe.accounts.retrieve(employee.stripeConnectAccountId);
  return syncConnectAccount(account, { db });
}
