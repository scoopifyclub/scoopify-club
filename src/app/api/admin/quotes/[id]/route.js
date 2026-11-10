import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { approveQuote, rejectQuote } from '@/lib/pricing-quotes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  return NextResponse.json({
    quote: {
      ...quote,
      proposedAmount: quote.proposedAmountCents != null ? quote.proposedAmountCents / 100 : null,
    },
  });
}

/**
 * PATCH /api/admin/quotes/[id]
 * { action: 'approve', amountCents|amount, planCode?, stripePriceId?, allowBelowFloor?, allowUnprofitable? }
 * { action: 'reject', reason? }
 *
 * Unprofitable quotes are never auto-accepted — allowUnprofitable must be set.
 */
export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || '').toLowerCase();

  if (action === 'approve') {
    const amountCents = body.amountCents != null
      ? Number(body.amountCents)
      : Math.round(Number(body.amount) * 100);
    const result = await approveQuote(id, {
      amountCents,
      planCode: body.planCode,
      stripePriceId: body.stripePriceId,
      allowBelowFloor: Boolean(body.allowBelowFloor),
      allowUnprofitable: Boolean(body.allowUnprofitable),
      adminUserId: auth.userId,
      expiresAt: body.expiresAt,
      db: prisma,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: result.status || 400 },
      );
    }
    return NextResponse.json({
      quote: {
        ...result.quote,
        proposedAmount: result.quote.proposedAmountCents / 100,
      },
    });
  }

  if (action === 'reject') {
    const result = await rejectQuote(id, {
      reason: body.reason,
      adminUserId: auth.userId,
      db: prisma,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }
    return NextResponse.json({ quote: result.quote });
  }

  return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
}
