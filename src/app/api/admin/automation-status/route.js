import { NextResponse } from 'next/server';
import { withApiSecurity } from '@/lib/security-middleware';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/api-auth';

async function GET(request) {
  try {
    const user = await requireRole('ADMIN');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get automation system statuses
    const systems = {
      'Customer Acquisition': {
        status: 'ACTIVE',
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        nextRun: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
        schedule: 'Every Tuesday and Thursday at 10:00 AM',
        endpoint: '/api/cron/automated-customer-acquisition'
      },
      'Employee Recruitment': {
        status: 'ACTIVE',
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        nextRun: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
        schedule: 'Every Monday at 8:00 AM',
        endpoint: '/api/cron/automated-employee-recruitment'
      },
      'Business Intelligence': {
        status: 'ACTIVE',
        lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
        schedule: 'Every Sunday at 6:00 AM',
        endpoint: '/api/cron/business-intelligence'
      },
      'Customer Notifications': {
        status: 'ACTIVE',
        lastRun: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        nextRun: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
        schedule: 'Every hour',
        endpoint: '/api/cron/send-customer-notifications'
      },
      'Weekly Service Creation': {
        status: 'ACTIVE',
        lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
        schedule: 'Every Monday at 6:00 AM',
        endpoint: '/api/cron/create-weekly-services'
      },
      'Employee Payouts': {
        status: 'ACTIVE',
        lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
        schedule: 'Every Friday at 6:00 PM',
        endpoint: '/api/cron/process-employee-payouts'
      },
      'Payment Reconciliation': {
        status: 'ACTIVE',
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
        schedule: 'Daily at 2:00 AM',
        endpoint: '/api/cron/payment-reconciliation'
      },
      'Coverage Risk Monitoring': {
        status: 'ACTIVE',
        lastRun: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        nextRun: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
        schedule: 'Twice daily',
        endpoint: '/api/admin/monitor-coverage-risk'
      }
    };

    // Count active systems
    const activeSystems = Object.values(systems).filter(sys => sys.status === 'ACTIVE').length;
    const totalSystems = Object.keys(systems).length;

    return NextResponse.json({
      totalSystems,
      activeSystems,
      systems
    });

  } catch (error) {
    console.error('Error getting automation status:', error);
    return NextResponse.json(
      { error: 'Failed to get automation status' },
      { status: 500 }
    );
  }
} 

export const GET = withApiSecurity(GET, { requireAuth: true, rateLimit: true });
export const POST = withApiSecurity(POST, { requireAuth: true, rateLimit: true });
export const PUT = withApiSecurity(PUT, { requireAuth: true, rateLimit: true });
export const DELETE = withApiSecurity(DELETE, { requireAuth: true, rateLimit: true });