import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  reconcileStripePayments, 
  getRecentReconciliationReports, 
  getReconciliationReport 
} from '@/lib/payment-reconciliation';
import { logger } from '@/lib/logger';

// GET: Get recent reconciliation reports
export async function GET(request: Request) {
  try {
    // Verify admin permission
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const reportId = url.searchParams.get('reportId');

    // If reportId is provided, get specific report details
    if (reportId) {
      const report = await getReconciliationReport(reportId);
      
      if (!report) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(report);
    }
    
    // Otherwise, get recent reports
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const reports = await getRecentReconciliationReports(limit);
    
    return NextResponse.json(reports);
  } catch (error) {
    logger.error('Error getting reconciliation reports:', error);
    
    return NextResponse.json(
      { error: 'Failed to get reconciliation reports' },
      { status: 500 }
    );
  }
}

// POST: Run a new reconciliation
export async function POST(request: Request) {
  try {
    // Verify admin permission
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get date range from request body
    const { startDate, endDate } = await request.json();
    
    // Parse dates if provided
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;
    
    // Run reconciliation
    const reconciliationResult = await reconcileStripePayments(
      startDateObj,
      endDateObj
    );
    
    return NextResponse.json({
      message: 'Reconciliation completed successfully',
      result: reconciliationResult
    });
  } catch (error) {
    logger.error('Error running payment reconciliation:', error);
    
    return NextResponse.json(
      { error: 'Failed to run reconciliation' },
      { status: 500 }
    );
  }
} 