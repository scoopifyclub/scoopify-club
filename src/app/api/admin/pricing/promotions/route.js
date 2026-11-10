import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { validatePromotionInput } from '@/lib/pricing-promotions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/admin/pricing/promotions */
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const activeOnly = new URL(request.url).searchParams.get('active') === '1';
  const promotions = await prisma.promotion.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: [{ active: 'desc' }, { code: 'asc' }],
  });
  return NextResponse.json({ promotions });
}

/** POST /api/admin/pricing/promotions */
export async function POST(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const validated = validatePromotionInput(body);
  if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400 });

  if (validated.value.maxRedemptions != null && (!Number.isInteger(validated.value.maxRedemptions) || validated.value.maxRedemptions < 1)) {
    return NextResponse.json({ error: 'maxRedemptions must be a positive integer' }, { status: 400 });
  }

  try {
    const promotion = await prisma.promotion.create({
      data: {
        id: randomUUID(),
        ...validated.value,
      },
    });

    await prisma.systemLog.create({
      data: {
        type: 'PROMOTION_CREATED',
        message: `Promotion ${promotion.code} created by admin ${auth.userId}`,
        data: { promotionId: promotion.id, code: promotion.code, type: promotion.type, adminUserId: auth.userId },
      },
    }).catch(() => {});

    return NextResponse.json({ promotion }, { status: 201 });
  } catch (error) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A promotion with that code already exists' }, { status: 409 });
    }
    console.error('Error creating promotion:', error);
    return NextResponse.json({ error: 'Failed to create promotion' }, { status: 500 });
  }
}
