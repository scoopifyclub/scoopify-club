import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { reconcileStripePayments, getRecentReconciliationReports, getReconciliationReport } from '@/lib/payment-reconciliation';
import { logger } from '@/lib/logger';
// GET: Get recent reconciliation reports
export async function GET(request) {
    var _a;
    try {
        // Verify admin permission
        // Get access token from cookies
        const cookieStore = await cookies();
        const accessToken = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Validate the token and check role
        const { userId, role } = await validateUser(accessToken);
        if (role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const url = new URL(request.url);
        const reportId = url.searchParams.get('reportId');
        // If reportId is provided, get specific report details
        if (reportId) {
            const report = await getReconciliationReport(reportId);
            if (!report) {
                return NextResponse.json({ error: 'Report not found' }, { status: 404 });
            }
            return NextResponse.json(report);
        }
        // Otherwise, get recent reports
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const reports = await getRecentReconciliationReports(limit);
        return NextResponse.json(reports);
    }
    catch (error) {
        logger.error('Error getting reconciliation reports:', error);
        return NextResponse.json({ error: 'Failed to get reconciliation reports' }, { status: 500 });
    }
}
// POST: Run a new reconciliation
export async function POST(request) {
    var _a;
    try {
        // Verify admin permission
        const cookieStore = await cookies();
        const accessToken = (_a = cookieStore.get('accessToken')) === null || _a === void 0 ? void 0 : _a.value;
        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Validate the token and check role
        const { userId, role } = await validateUser(accessToken);
        if (role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Get date range from request body
        const { startDate, endDate } = await request.json();
        // Parse dates if provided
        const startDateObj = startDate ? new Date(startDate) : undefined;
        const endDateObj = endDate ? new Date(endDate) : undefined;
        // Run reconciliation
        const reconciliationResult = await reconcileStripePayments(startDateObj, endDateObj);
        return NextResponse.json({
            message: 'Reconciliation completed successfully',
            result: reconciliationResult
        });
    }
    catch (error) {
        logger.error('Error running payment reconciliation:', error);
        return NextResponse.json({ error: 'Failed to run reconciliation' }, { status: 500 });
    }
}
