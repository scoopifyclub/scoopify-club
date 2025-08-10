import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateUserToken } from '@/lib/jwt-utils';
import { cookies } from 'next/headers';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) {
      console.log('No access token found in cookies');
      return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
    }
    const decoded = await validateUserToken(token);
    console.log('Token verification result:', decoded ? 'success' : 'failed');
    if (!decoded || decoded.role !== 'ADMIN') {
      console.log('Invalid token or not admin:', decoded?.role);
      return NextResponse.json({ error: 'Unauthorized - Not admin' }, { status: 401 });
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