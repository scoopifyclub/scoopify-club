import { NextResponse } from 'next/server';
import { requireCronOrAdmin } from '@/lib/cron-auth';
import { createRecurringServices, DEFAULT_HORIZON_DAYS } from '@/lib/recurring-services';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Runs daily from Vercel Cron (see vercel.json). Creates the recurring visits
// due in the next DEFAULT_HORIZON_DAYS Denver days for every ACTIVE
// subscription, on the customer's preferred day. Re-running is a no-op, so a
// missed or doubled invocation is harmless. Optional ?days=N (admin backfill).
async function handle(request) {
  const auth = await requireCronOrAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const days = Number(new URL(request.url).searchParams.get('days')) || DEFAULT_HORIZON_DAYS;
    const result = await createRecurringServices({ days });

    console.log(
      `Recurring visits ${result.window.from}..${result.window.to}: created ${result.created}, ` +
      `already scheduled ${result.alreadyScheduled}, missing service day ${result.missingServiceDay.length}`
    );

    return NextResponse.json({
      success: true,
      servicesCreated: result.created,
      ...result,
    });
  } catch (error) {
    console.error('Error in weekly service creation:', error);
    return NextResponse.json(
      { error: 'Failed to create weekly services' },
      { status: 500 }
    );
  }
}

export const GET = handle;
export const POST = handle;
