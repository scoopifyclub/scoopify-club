import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { requeueOverdueUnclaimed } from '@/lib/job-claims';
import { createRecurringServices, MAX_HORIZON_DAYS } from '@/lib/recurring-services';
import { localDateString } from '@/lib/business-time';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

// Admin bulk scheduling: creates the recurring visits due between startDate
// and endDate (America/Denver dates, at most MAX_HORIZON_DAYS, never in the
// past) through the same idempotent generator as the daily cron.
export async function POST(request) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;
        const { startDate, endDate } = await request.json();
        if (!startDate || !endDate) {
            return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 });
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
            return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
        }
        const days = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
        if (days > MAX_HORIZON_DAYS) {
            return NextResponse.json({ error: `Date range is limited to ${MAX_HORIZON_DAYS} days` }, { status: 400 });
        }
        const { requeued } = await requeueOverdueUnclaimed();
        const result = await createRecurringServices({ from: localDateString(start), days });
        return NextResponse.json({
            message: `Created ${result.created} services, rescheduled ${requeued} unclaimed services`,
            rescheduled: requeued,
            ...result,
        });
    }
    catch (error) {
        console.error('Service scheduling error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
