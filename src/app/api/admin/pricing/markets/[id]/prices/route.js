import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { ALL_CATALOG_ITEMS, findPlan } from '@/lib/pricing-catalog';
import { validateOverrideAmount } from '@/lib/pricing-markets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PUT /api/admin/pricing/markets/[id]/prices
 * Body: { prices: [{ planCode, amountCents|amount, stripePriceId?, allowBelowFloor?, allowUnprofitable? }], replace? }
 *
 * Writes new MarketPrice rows (effectiveFrom = now). Existing subscriptions keep
 * their Stripe Prices; only new checkouts resolve through these overlays.
 */
export async function PUT(request, { params }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id: marketId } = await params;
  const market = await prisma.market.findUnique({ where: { id: marketId } });
  if (!market) return NextResponse.json({ error: 'Market not found' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const rows = Array.isArray(body.prices) ? body.prices : [];
  if (rows.length === 0) {
    return NextResponse.json({ error: 'prices array is required' }, { status: 400 });
  }

  const now = new Date();
  const toCreate = [];
  for (const row of rows) {
    const item = findPlan(row.planCode);
    if (!item) {
      return NextResponse.json({ error: `Unknown planCode: ${row.planCode}` }, { status: 400 });
    }
    const amountCents = row.amountCents != null
      ? Number(row.amountCents)
      : Math.round(Number(row.amount) * 100);
    const kind = item.kind === 'subscription' ? 'SUBSCRIPTION' : 'ONE_TIME';
    const check = validateOverrideAmount(item.id, amountCents, {
      kind,
      allowBelowFloor: Boolean(row.allowBelowFloor || body.allowBelowFloor),
      allowUnprofitable: Boolean(row.allowUnprofitable || body.allowUnprofitable),
    });
    if (!check.ok) {
      return NextResponse.json({ error: check.error, planCode: item.id, details: check }, { status: 400 });
    }
    toCreate.push({
      id: randomUUID(),
      marketId,
      planCode: item.id,
      amountCents,
      stripePriceId: row.stripePriceId ? String(row.stripePriceId).trim() : null,
      effectiveFrom: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  const result = await prisma.$transaction(async (tx) => {
    if (body.replace) {
      await tx.marketPrice.updateMany({
        where: {
          marketId,
          planCode: { in: toCreate.map((p) => p.planCode) },
          effectiveTo: null,
        },
        data: { effectiveTo: now, updatedAt: now },
      });
    }
    await tx.marketPrice.createMany({ data: toCreate });
    return tx.market.findUnique({
      where: { id: marketId },
      include: { prices: { orderBy: [{ planCode: 'asc' }, { effectiveFrom: 'desc' }] } },
    });
  });

  await prisma.systemLog.create({
    data: {
      type: 'MARKET_PRICES_UPDATED',
      message: `Market ${market.slug} prices updated by admin ${auth.userId}`,
      data: {
        marketId,
        adminUserId: auth.userId,
        planCodes: toCreate.map((p) => p.planCode),
        amounts: Object.fromEntries(toCreate.map((p) => [p.planCode, p.amountCents])),
      },
    },
  }).catch(() => {});

  return NextResponse.json({
    market: {
      ...result,
      prices: result.prices.map((p) => ({ ...p, amount: p.amountCents / 100 })),
    },
    catalogPlanCodes: ALL_CATALOG_ITEMS.map((i) => i.id),
  });
}

export async function GET(request, { params }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id: marketId } = await params;
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    include: { prices: { orderBy: [{ planCode: 'asc' }, { effectiveFrom: 'desc' }] } },
  });
  if (!market) return NextResponse.json({ error: 'Market not found' }, { status: 404 });

  return NextResponse.json({
    marketId,
    prices: market.prices.map((p) => ({ ...p, amount: p.amountCents / 100 })),
    catalogPlanCodes: ALL_CATALOG_ITEMS.map((i) => i.id),
  });
}
