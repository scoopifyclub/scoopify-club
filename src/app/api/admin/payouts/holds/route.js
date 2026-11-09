import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { resolveHold } from '@/lib/payout-holds';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/admin/payouts/holds?status=OPEN  refund/dispute holds and the scooper pay they cover. */
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const status = new URL(request.url).searchParams.get('status') || 'OPEN';
  const holds = await prisma.payoutHold.findMany({
    where: status === 'ALL' ? {} : { status },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  const held = holds.length
    ? await prisma.jobFinancialRecord.findMany({
        where: { payoutStatus: 'HELD', holdReason: { in: holds.map((h) => `${h.reason}:${h.id}`) } },
        select: { id: true, serviceId: true, employeeId: true, scooperEarningCents: true, completedAt: true, holdReason: true },
      })
    : [];
  return NextResponse.json({
    holds: holds.map((h) => {
      const jobs = held.filter((r) => r.holdReason === `${h.reason}:${h.id}`);
      return { ...h, heldJobs: jobs, heldAmount: jobs.reduce((s, r) => s + r.scooperEarningCents, 0) / 100 };
    }),
  });
}

/**
 * POST /api/admin/payouts/holds
 * { holdId, action: 'release' }                 pay the held jobs on the next run
 * { holdId, action: 'void', serviceIds?, note? } void (or claw back) those jobs' pay
 */
export async function POST(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { holdId, action, serviceIds, note } = await request.json().catch(() => ({}));
  if (!holdId) return NextResponse.json({ error: 'holdId is required' }, { status: 400 });
  try {
    const result = await resolveHold({ holdId, action, serviceIds, note, adminId: auth.user?.id });
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error resolving payout hold:', error);
    return NextResponse.json({ error: 'Failed to resolve hold' }, { status: 500 });
  }
}
