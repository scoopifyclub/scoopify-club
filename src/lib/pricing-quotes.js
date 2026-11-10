import { randomUUID } from 'crypto';
import {
  QUOTE_KINDS,
  QUOTE_MIN_DOGS,
  QUOTE_STATUSES,
  findPlan,
  requiresQuote,
} from '@/lib/pricing-catalog';
import { isProfitableAmount, normalizeZip, validateOverrideAmount } from '@/lib/pricing-markets';

const DEFAULT_EXPIRY_DAYS = 14;

export function quoteNeedsAdmin({ dogCount, unusualYard, unusualAccess, remoteAddress } = {}) {
  return requiresQuote({ dogCount, unusualYard, unusualAccess, remoteAddress });
}

export function validateQuoteRequest(input = {}) {
  const contactEmail = String(input.contactEmail || input.email || '').trim().toLowerCase();
  if (!contactEmail || !contactEmail.includes('@')) {
    return { ok: false, error: 'A valid contact email is required' };
  }
  const dogCount = Number(input.dogCount);
  if (!Number.isInteger(dogCount) || dogCount < 1) {
    return { ok: false, error: 'dogCount must be a positive integer' };
  }
  const kind = String(input.kind || QUOTE_KINDS.ONE_TIME).toUpperCase();
  if (!Object.values(QUOTE_KINDS).includes(kind)) {
    return { ok: false, error: `kind must be ${Object.values(QUOTE_KINDS).join(' or ')}` };
  }
  const unusualYard = Boolean(input.unusualYard);
  const unusualAccess = Boolean(input.unusualAccess);
  const remoteAddress = Boolean(input.remoteAddress);
  // Catalog checkout already covers 1–3 dogs with a normal yard. Quote path is
  // for 4+ dogs or flagged unusual jobs; still accept any dogCount so admins
  // can quote a 2-dog neglected yard.
  if (!quoteNeedsAdmin({ dogCount, unusualYard, unusualAccess, remoteAddress }) && !input.forceQuote) {
    return {
      ok: false,
      error: `Use online checkout for ${QUOTE_MIN_DOGS - 1} or fewer dogs unless the yard is unusual`,
      code: 'use_catalog_checkout',
    };
  }
  return {
    ok: true,
    value: {
      contactName: input.contactName || input.name ? String(input.contactName || input.name).trim() : null,
      contactEmail,
      contactPhone: input.contactPhone || input.phone ? String(input.contactPhone || input.phone).trim() : null,
      customerId: input.customerId || null,
      dogCount,
      zipCode: normalizeZip(input.zipCode || input.zip),
      addressLine: input.addressLine || input.street ? String(input.addressLine || input.street).trim() : null,
      city: input.city ? String(input.city).trim() : null,
      state: input.state ? String(input.state).trim().toUpperCase().slice(0, 2) : null,
      kind,
      unusualYard,
      unusualAccess,
      remoteAddress,
      notes: input.notes ? String(input.notes).trim().slice(0, 4000) : null,
      planCode: input.planCode && findPlan(input.planCode) ? findPlan(input.planCode).id : null,
    },
  };
}

export async function createQuoteRequest(input, { db, now = new Date() } = {}) {
  const validated = validateQuoteRequest(input);
  if (!validated.ok) return validated;
  if (!db) return { ok: false, error: 'Database is required' };

  const quote = await db.quote.create({
    data: {
      id: randomUUID(),
      status: QUOTE_STATUSES.PENDING_ADMIN,
      ...validated.value,
      expiresAt: new Date(now.getTime() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
    },
  });

  await db.systemLog.create({
    data: {
      type: 'QUOTE_REQUESTED',
      message: `Quote ${quote.id} requested for ${quote.dogCount} dog(s) by ${quote.contactEmail}`,
      data: {
        quoteId: quote.id,
        dogCount: quote.dogCount,
        kind: quote.kind,
        zipCode: quote.zipCode,
        unusualYard: quote.unusualYard,
        unusualAccess: quote.unusualAccess,
        remoteAddress: quote.remoteAddress,
      },
    },
  }).catch(() => {});

  return { ok: true, quote };
}

/**
 * Admin approval. Never auto-accepts unprofitable amounts unless
 * allowUnprofitable is explicitly true.
 */
export async function approveQuote(quoteId, {
  amountCents,
  planCode,
  stripePriceId,
  allowBelowFloor = false,
  allowUnprofitable = false,
  adminUserId,
  expiresAt,
  db,
  now = new Date(),
} = {}) {
  if (!db) return { ok: false, error: 'Database is required', status: 500 };
  const quote = await db.quote.findUnique({ where: { id: quoteId } });
  if (!quote) return { ok: false, error: 'Quote not found', status: 404 };
  if (quote.status === QUOTE_STATUSES.CONVERTED) {
    return { ok: false, error: 'Quote already converted', status: 409 };
  }
  if (quote.status === QUOTE_STATUSES.REJECTED) {
    return { ok: false, error: 'Rejected quotes cannot be approved', status: 409 };
  }

  const resolvedPlanCode = planCode || quote.planCode || null;
  const kind = quote.kind === QUOTE_KINDS.SUBSCRIPTION ? 'SUBSCRIPTION' : 'ONE_TIME';
  const check = validateOverrideAmount(resolvedPlanCode, amountCents, {
    kind,
    allowBelowFloor,
    allowUnprofitable,
  });
  if (!check.ok) return { ok: false, error: check.error, status: 400, details: check };

  // Extra safety: even without a plan code, refuse unprofitable unless forced.
  if (!isProfitableAmount(amountCents, { kind }) && !allowUnprofitable) {
    return {
      ok: false,
      error: 'Amount would be unprofitable; set allowUnprofitable to override',
      status: 400,
    };
  }

  const updated = await db.quote.update({
    where: { id: quoteId },
    data: {
      status: QUOTE_STATUSES.APPROVED,
      proposedAmountCents: Number(amountCents),
      planCode: resolvedPlanCode,
      stripePriceId: stripePriceId || null,
      approvedBy: adminUserId || null,
      approvedAt: now,
      rejectedReason: null,
      expiresAt: expiresAt ? new Date(expiresAt) : quote.expiresAt,
      updatedAt: now,
    },
  });

  await db.systemLog.create({
    data: {
      type: 'QUOTE_APPROVED',
      message: `Quote ${quoteId} approved at $${(amountCents / 100).toFixed(2)} by admin ${adminUserId || 'unknown'}`,
      data: {
        quoteId,
        amountCents: Number(amountCents),
        planCode: resolvedPlanCode,
        adminUserId,
        allowUnprofitable,
        allowBelowFloor,
        retainedCents: check.retainedCents,
      },
    },
  }).catch(() => {});

  return { ok: true, quote: updated };
}

export async function rejectQuote(quoteId, { reason, adminUserId, db, now = new Date() } = {}) {
  if (!db) return { ok: false, error: 'Database is required', status: 500 };
  const quote = await db.quote.findUnique({ where: { id: quoteId } });
  if (!quote) return { ok: false, error: 'Quote not found', status: 404 };
  if (quote.status === QUOTE_STATUSES.CONVERTED) {
    return { ok: false, error: 'Converted quotes cannot be rejected', status: 409 };
  }

  const updated = await db.quote.update({
    where: { id: quoteId },
    data: {
      status: QUOTE_STATUSES.REJECTED,
      rejectedReason: reason ? String(reason).trim().slice(0, 1000) : null,
      approvedBy: adminUserId || null,
      approvedAt: null,
      updatedAt: now,
    },
  });

  await db.systemLog.create({
    data: {
      type: 'QUOTE_REJECTED',
      message: `Quote ${quoteId} rejected by admin ${adminUserId || 'unknown'}`,
      data: { quoteId, adminUserId, reason: updated.rejectedReason },
    },
  }).catch(() => {});

  return { ok: true, quote: updated };
}

/**
 * Resolve an approved quote for Checkout. Client-supplied amounts are ignored;
 * only the admin-approved amount / Stripe Price may be charged.
 */
export function resolveApprovedQuoteForCheckout(quote, { now = new Date() } = {}) {
  if (!quote) return { ok: false, error: 'Quote not found', code: 'quote_not_found' };
  if (quote.status === QUOTE_STATUSES.EXPIRED || (quote.expiresAt && new Date(quote.expiresAt) <= now)) {
    return { ok: false, error: 'Quote has expired', code: 'quote_expired' };
  }
  if (quote.status === QUOTE_STATUSES.CONVERTED) {
    return { ok: false, error: 'Quote already converted', code: 'quote_converted' };
  }
  if (quote.status !== QUOTE_STATUSES.APPROVED) {
    return { ok: false, error: 'Quote is not approved', code: 'quote_not_approved' };
  }
  const amountCents = Number(quote.proposedAmountCents);
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return { ok: false, error: 'Approved quote is missing an amount', code: 'quote_missing_amount' };
  }
  const isSubscription = quote.kind === QUOTE_KINDS.SUBSCRIPTION;
  return {
    ok: true,
    quote,
    amountCents,
    isSubscription,
    stripePriceId: quote.stripePriceId || null,
    planCode: quote.planCode || `quote-${quote.id}`,
    lineItem: quote.stripePriceId
      ? { price: quote.stripePriceId, quantity: 1 }
      : {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Scoopify quoted service (${quote.dogCount} dog${quote.dogCount === 1 ? '' : 's'})`,
              metadata: { quoteId: quote.id },
            },
            unit_amount: amountCents,
            ...(isSubscription ? { recurring: { interval: 'month' } } : {}),
          },
          quantity: 1,
        },
  };
}

/** Attach a Checkout Session without converting yet — abandoners can retry. */
export async function attachQuoteCheckoutSession(quoteId, { checkoutSessionId, db, now = new Date() } = {}) {
  if (!db) return null;
  return db.quote.update({
    where: { id: quoteId },
    data: {
      checkoutSessionId: checkoutSessionId || null,
      updatedAt: now,
    },
  });
}

/** Mark converted after a successful payment (webhook), not at session create. */
export async function markQuoteConverted(quoteId, { checkoutSessionId, db, now = new Date() } = {}) {
  if (!db) return null;
  return db.quote.update({
    where: { id: quoteId },
    data: {
      status: QUOTE_STATUSES.CONVERTED,
      convertedAt: now,
      checkoutSessionId: checkoutSessionId || null,
      updatedAt: now,
    },
  });
}
