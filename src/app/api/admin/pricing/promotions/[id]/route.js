import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { PROMOTION_TYPES, findPlan } from '@/lib/pricing-catalog';
import { normalizePromoCode } from '@/lib/pricing-promotions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const promotion = await prisma.promotion.findUnique({ where: { id } });
  if (!promotion) return NextResponse.json({ error: 'Promotion not found' }, { status: 404 });
  return NextResponse.json({ promotion });
}

export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await prisma.promotion.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Promotion not found' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const data = {};

  if (body.code != null) data.code = normalizePromoCode(body.code);
  if (body.name != null) data.name = String(body.name).trim();
  if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;
  if (body.type != null) {
    const type = String(body.type).toUpperCase();
    if (!Object.values(PROMOTION_TYPES).includes(type)) {
      return NextResponse.json({ error: `type must be one of ${Object.values(PROMOTION_TYPES).join(', ')}` }, { status: 400 });
    }
    data.type = type;
  }
  if (body.amount != null) {
    const amount = Number(body.amount);
    if (!Number.isInteger(amount) || amount < 0) {
      return NextResponse.json({ error: 'amount must be a non-negative integer' }, { status: 400 });
    }
    data.amount = amount;
  }
  if (Array.isArray(body.planCodes)) {
    for (const planCode of body.planCodes) {
      if (!findPlan(planCode)) {
        return NextResponse.json({ error: `Unknown planCode: ${planCode}` }, { status: 400 });
      }
    }
    data.planCodes = body.planCodes.map(String);
  }
  if (Array.isArray(body.marketIds)) data.marketIds = body.marketIds.map(String);
  if (body.startsAt !== undefined) data.startsAt = body.startsAt ? new Date(body.startsAt) : null;
  if (body.endsAt !== undefined) data.endsAt = body.endsAt ? new Date(body.endsAt) : null;
  if (body.maxRedemptions !== undefined) {
    data.maxRedemptions = body.maxRedemptions == null ? null : Number(body.maxRedemptions);
  }
  if (body.active != null) data.active = Boolean(body.active);

  try {
    const promotion = await prisma.promotion.update({ where: { id }, data });
    await prisma.systemLog.create({
      data: {
        type: 'PROMOTION_UPDATED',
        message: `Promotion ${promotion.code} updated by admin ${auth.userId}`,
        data: { promotionId: id, adminUserId: auth.userId, changes: Object.keys(data) },
      },
    }).catch(() => {});
    return NextResponse.json({ promotion });
  } catch (error) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A promotion with that code already exists' }, { status: 409 });
    }
    console.error('Error updating promotion:', error);
    return NextResponse.json({ error: 'Failed to update promotion' }, { status: 500 });
  }
}
