import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { normalizeZip, slugifyMarketName } from '@/lib/pricing-markets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function serializeMarket(market) {
  return {
    ...market,
    prices: (market.prices || []).map((p) => ({
      ...p,
      amount: p.amountCents / 100,
    })),
  };
}

/** GET /api/admin/pricing/markets — list markets with active price overlays. */
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const markets = await prisma.market.findMany({
    include: { prices: { orderBy: [{ planCode: 'asc' }, { effectiveFrom: 'desc' }] } },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ markets: markets.map(serializeMarket) });
}

/** POST /api/admin/pricing/markets — create a market (ZIP-keyed pricing overlay). */
export async function POST(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const slug = String(body.slug || slugifyMarketName(name)).trim().toLowerCase();
  if (!slug) return NextResponse.json({ error: 'slug is required' }, { status: 400 });

  const zipCodes = Array.isArray(body.zipCodes)
    ? [...new Set(body.zipCodes.map(normalizeZip).filter(Boolean))]
    : [];
  if (zipCodes.length === 0) {
    return NextResponse.json({ error: 'At least one valid zipCode is required' }, { status: 400 });
  }

  try {
    const market = await prisma.market.create({
      data: {
        id: randomUUID(),
        name,
        slug,
        zipCodes,
        active: body.active !== false,
        notes: body.notes ? String(body.notes).trim() : null,
      },
      include: { prices: true },
    });

    await prisma.systemLog.create({
      data: {
        type: 'MARKET_CREATED',
        message: `Market ${market.slug} created by admin ${auth.userId}`,
        data: { marketId: market.id, zipCodes, adminUserId: auth.userId },
      },
    }).catch(() => {});

    return NextResponse.json({ market: serializeMarket(market) }, { status: 201 });
  } catch (error) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A market with that slug already exists' }, { status: 409 });
    }
    console.error('Error creating market:', error);
    return NextResponse.json({ error: 'Failed to create market' }, { status: 500 });
  }
}
