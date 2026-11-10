import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { normalizeZip, slugifyMarketName } from '@/lib/pricing-markets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function loadMarket(id) {
  return prisma.market.findUnique({
    where: { id },
    include: { prices: { orderBy: [{ planCode: 'asc' }, { effectiveFrom: 'desc' }] } },
  });
}

export async function GET(request, { params }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const market = await loadMarket(id);
  if (!market) return NextResponse.json({ error: 'Market not found' }, { status: 404 });
  return NextResponse.json({
    market: {
      ...market,
      prices: market.prices.map((p) => ({ ...p, amount: p.amountCents / 100 })),
    },
  });
}

export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await prisma.market.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Market not found' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const data = {};
  if (body.name != null) data.name = String(body.name).trim();
  if (body.slug != null) data.slug = String(body.slug || slugifyMarketName(body.name || existing.name)).trim().toLowerCase();
  if (body.active != null) data.active = Boolean(body.active);
  if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).trim() : null;
  if (Array.isArray(body.zipCodes)) {
    data.zipCodes = [...new Set(body.zipCodes.map(normalizeZip).filter(Boolean))];
    if (data.zipCodes.length === 0) {
      return NextResponse.json({ error: 'At least one valid zipCode is required' }, { status: 400 });
    }
  }

  try {
    const market = await prisma.market.update({
      where: { id },
      data,
      include: { prices: { orderBy: [{ planCode: 'asc' }, { effectiveFrom: 'desc' }] } },
    });

    await prisma.systemLog.create({
      data: {
        type: 'MARKET_UPDATED',
        message: `Market ${market.slug} updated by admin ${auth.userId}`,
        data: { marketId: market.id, adminUserId: auth.userId, changes: Object.keys(data) },
      },
    }).catch(() => {});

    return NextResponse.json({
      market: {
        ...market,
        prices: market.prices.map((p) => ({ ...p, amount: p.amountCents / 100 })),
      },
    });
  } catch (error) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A market with that slug already exists' }, { status: 409 });
    }
    console.error('Error updating market:', error);
    return NextResponse.json({ error: 'Failed to update market' }, { status: 500 });
  }
}

/** Soft-deactivate by default; hard delete only when ?hard=1 and no prices. */
export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await prisma.market.findUnique({
    where: { id },
    include: { _count: { select: { prices: true } } },
  });
  if (!existing) return NextResponse.json({ error: 'Market not found' }, { status: 404 });

  const hard = new URL(request.url).searchParams.get('hard') === '1';
  if (hard) {
    await prisma.market.delete({ where: { id } });
  } else {
    await prisma.market.update({ where: { id }, data: { active: false } });
  }

  await prisma.systemLog.create({
    data: {
      type: hard ? 'MARKET_DELETED' : 'MARKET_DEACTIVATED',
      message: `Market ${existing.slug} ${hard ? 'deleted' : 'deactivated'} by admin ${auth.userId}`,
      data: { marketId: id, adminUserId: auth.userId },
    },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
