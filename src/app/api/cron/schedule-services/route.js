import { NextResponse } from 'next/server';
import { requireCronOrAdmin } from '@/lib/cron-auth';
import { requeueOverdueUnclaimed } from '@/lib/job-claims';
import { createRecurringServices } from '@/lib/recurring-services';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Legacy combined job (not scheduled): rolls overdue unclaimed jobs onto today
// and creates due recurring visits. The scheduled equivalents are
// /api/cron/open-job-pool and /api/cron/create-weekly-services; both paths
// share the same code, so running either or both creates no duplicates.
async function handle(request) {
    try {
        const auth = await requireCronOrAdmin(request);
        if (!auth.ok) return auth.response;
        const { requeued } = await requeueOverdueUnclaimed();
        const result = await createRecurringServices();
        return NextResponse.json({
            message: 'Service scheduling completed',
            rescheduled: requeued,
            scheduled: result.created,
            ...result,
        });
    }
    catch (error) {
        console.error('Error in service scheduling:', error);
        return NextResponse.json({ error: 'Failed to process service scheduling' }, { status: 500 });
    }
}

export const GET = handle;
export const POST = handle;
