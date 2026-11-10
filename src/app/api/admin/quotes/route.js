import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { QUOTE_STATUSES } from '@/lib/pricing-catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/admin/quotes?status=PENDING_ADMIN */
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const status = new URL(request.url).searchParams.get('status');
  const where = {};
  if (status && status !== 'ALL') {
    if (!Object.values(QUOTE_STATUSES).includes(status)) {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
    }
    where.status = status;
  }

  const quotes = await prisma.quote.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return NextResponse.json({
    quotes: quotes.map((q) => ({
      ...q,
      proposedAmount: q.proposedAmountCents != null ? q.proposedAmountCents / 100 : null,
    })),
  });
}
