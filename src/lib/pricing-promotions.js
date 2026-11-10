import { PROMOTION_TYPES, findPlan } from '@/lib/pricing-catalog';

export function normalizePromoCode(code) {
  return String(code || '').trim().toUpperCase().replace(/\s+/g, '');
}

export function validatePromotionInput(input = {}) {
  const code = normalizePromoCode(input.code);
  if (!code || code.length < 3) {
    return { ok: false, error: 'Promotion code must be at least 3 characters' };
  }
  const type = String(input.type || '').toUpperCase();
  if (!Object.values(PROMOTION_TYPES).includes(type)) {
    return { ok: false, error: `type must be one of ${Object.values(PROMOTION_TYPES).join(', ')}` };
  }
  const amount = Number(input.amount);
  if (type === PROMOTION_TYPES.FREE_CATCHUP) {
    // amount is ignored for free catch-up; store 0
  } else if (!Number.isInteger(amount) || amount <= 0) {
    return { ok: false, error: 'amount must be a positive integer (percent points or cents)' };
  } else if (type === PROMOTION_TYPES.PERCENT && amount > 100) {
    return { ok: false, error: 'PERCENT amount cannot exceed 100' };
  }
  const planCodes = Array.isArray(input.planCodes)
    ? input.planCodes.map(String)
    : [];
  for (const planCode of planCodes) {
    if (!findPlan(planCode)) {
      return { ok: false, error: `Unknown planCode: ${planCode}` };
    }
  }
  return {
    ok: true,
    value: {
      code,
      name: String(input.name || code).trim(),
      description: input.description ? String(input.description).trim() : null,
      type,
      amount: type === PROMOTION_TYPES.FREE_CATCHUP ? 0 : amount,
      planCodes,
      marketIds: Array.isArray(input.marketIds) ? input.marketIds.map(String) : [],
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      maxRedemptions: input.maxRedemptions == null ? null : Number(input.maxRedemptions),
      active: input.active !== false,
    },
  };
}

export function isPromotionActive(promo, { now = new Date(), marketId = null, planCode = null } = {}) {
  if (!promo || promo.active === false) return false;
  if (promo.startsAt && new Date(promo.startsAt) > now) return false;
  if (promo.endsAt && new Date(promo.endsAt) <= now) return false;
  if (promo.maxRedemptions != null && promo.redemptionCount >= promo.maxRedemptions) return false;
  if (planCode && Array.isArray(promo.planCodes) && promo.planCodes.length > 0) {
    if (!promo.planCodes.includes(planCode)) return false;
  }
  if (marketId && Array.isArray(promo.marketIds) && promo.marketIds.length > 0) {
    if (!promo.marketIds.includes(marketId)) return false;
  }
  return true;
}

/**
 * Apply a promotion to a checkout quote (amounts in cents).
 * Returns discountCents and whether catch-up should be waived.
 * Never reduces the charge below $0.
 */
export function applyPromotion(promo, { amountCents, planCode, marketId, now = new Date() } = {}) {
  if (!isPromotionActive(promo, { now, marketId, planCode })) {
    return { ok: false, error: 'Promotion is not active for this checkout' };
  }
  const charge = Number(amountCents) || 0;
  if (promo.type === PROMOTION_TYPES.FREE_CATCHUP) {
    return { ok: true, discountCents: 0, waiveCatchUp: true, promotionId: promo.id, code: promo.code };
  }
  let discountCents = 0;
  if (promo.type === PROMOTION_TYPES.PERCENT) {
    discountCents = Math.round(charge * (promo.amount / 100));
  } else if (promo.type === PROMOTION_TYPES.FIXED) {
    discountCents = promo.amount;
  }
  discountCents = Math.max(0, Math.min(discountCents, charge));
  return {
    ok: true,
    discountCents,
    waiveCatchUp: false,
    finalAmountCents: charge - discountCents,
    promotionId: promo.id,
    code: promo.code,
  };
}

export async function findPromotionByCode(code, { db } = {}) {
  if (!db) return null;
  const normalized = normalizePromoCode(code);
  if (!normalized) return null;
  return db.promotion.findUnique({ where: { code: normalized } });
}
