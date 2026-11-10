import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/auth-rate-limit';
import { createQuoteRequest } from '@/lib/pricing-quotes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/quotes — public quote request for 4+ dogs or unusual yards.
 * Never creates a charge; admin must approve before Checkout.
 */
export async function POST(request) {
  const identifier = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await rateLimit(identifier, 10, '10 m');
  if (!success) {
    return NextResponse.json({ error: 'Too many quote requests', code: 'rate_limit_exceeded' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  try {
    const result = await createQuoteRequest(body, { db: prisma });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, code: result.code || 'invalid_quote' },
        { status: 400 },
      );
    }
    return NextResponse.json({
      quoteId: result.quote.id,
      status: result.quote.status,
      message: 'Thanks — we will review your yard and send a quote. Unusual jobs are never auto-accepted.',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating quote request:', error);
    return NextResponse.json({ error: 'Failed to submit quote request' }, { status: 500 });
  }
}
