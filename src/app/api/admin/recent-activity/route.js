import { NextResponse } from 'next/server';
import { withApiSecurity } from '@/lib/security-middleware';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


async function getHandler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    const type = searchParams.get('type'); // Optional filter by activity type

    // Build the query
    let whereClause = {};
    if (type) {
      whereClause.type = type;
    }

    // Get recent system logs
    const recentLogs = await prisma.systemLog.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      select: {
        id: true,
        type: true,
        message: true,
        details: true,
        severity: true,
        createdAt: true
      }
    });

    // Get recent automation-specific activities
    const automationActivities = await getAutomationActivities();

    // Combine and format activities
    const activities = [
      ...recentLogs.map(log => ({
        id: log.id,
        type: 'SYSTEM_LOG',
        title: log.message,
        description: log.details,
        severity: log.severity,
        timestamp: log.createdAt,
        category: getActivityCategory(log.type)
      })),
      ...automationActivities
    ];

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Group activities by date
    const groupedActivities = groupActivitiesByDate(activities);

    return NextResponse.json({
      success: true,
      activities: groupedActivities,
      totalCount: activities.length
    });

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    );
  }
}

async function getAutomationActivities() {
  const activities = [];

  try {
    // Get recent employee recruitment activities
    const recruitmentActivities = await getRecruitmentActivities();
    activities.push(...recruitmentActivities);

    // Get recent customer acquisition activities
    const acquisitionActivities = await getAcquisitionActivities();
    activities.push(...acquisitionActivities);

    // Get recent business intelligence activities
    const biActivities = await getBusinessIntelligenceActivities();
    activities.push(...biActivities);

    // Get recent service creation activities
    const serviceActivities = await getServiceActivities();
    activities.push(...serviceActivities);

    // Get recent payment activities
    const paymentActivities = await getPaymentActivities();
    activities.push(...paymentActivities);

  } catch (error) {
    console.error('Error getting automation activities:', error);
  }

  return activities;
}

async function getRecruitmentActivities() {
  const activities = [];

  try {
    // Get recent job postings
    const recentJobPostings = await prisma.$queryRaw`
      SELECT 
        'JOB_POSTING' as type,
        CONCAT('Job posted for ', zipCode) as title,
        CONCAT('Posted job for ', customerCount, ' customers in ', zipCode) as description,
        'INFO' as severity,
        NOW() as timestamp
      FROM (
        SELECT DISTINCT zipCode, COUNT(*) as customerCount
        FROM Customer
        WHERE status = 'ACTIVE'
        GROUP BY zipCode
        HAVING COUNT(*) > 10
        ORDER BY COUNT(*) DESC
        LIMIT 5
      ) as high_priority_areas
    `;

    activities.push(...recentJobPostings.map(activity => ({
      ...activity,
      id: `recruitment_${Date.now()}_${Math.random()}`,
      category: 'RECRUITMENT'
    })));

  } catch (error) {
    console.error('Error getting recruitment activities:', error);
  }

  return activities;
}

async function getAcquisitionActivities() {
  const activities = [];

  try {
    // Get recent customer signups
    const recentSignups = await prisma.customer.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      select: {
        id: true,
        email: true,
        zipCode: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    activities.push(...recentSignups.map(customer => ({
      id: `acquisition_${customer.id}`,
      type: 'CUSTOMER_ACQUISITION',
      title: `New customer signed up`,
      description: `Customer ${customer.email} joined in ${customer.zipCode}`,
      severity: 'INFO',
      timestamp: customer.createdAt,
      category: 'ACQUISITION'
    })));

  } catch (error) {
    console.error('Error getting acquisition activities:', error);
  }

  return activities;
}

async function getBusinessIntelligenceActivities() {
  const activities = [];

  try {
    // Get recent business reports
    const recentReports = await prisma.$queryRaw`
      SELECT 
        'BUSINESS_REPORT' as type,
        'Weekly business report generated' as title,
        CONCAT('Report covers ', COUNT(*), ' services and $', SUM(amount), ' revenue') as description,
        'INFO' as severity,
        NOW() as timestamp
      FROM Service
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;

    if (recentReports.length > 0) {
      activities.push({
        id: `bi_${Date.now()}`,
        ...recentReports[0],
        category: 'BUSINESS_INTELLIGENCE'
      });
    }

  } catch (error) {
    console.error('Error getting business intelligence activities:', error);
  }

  return activities;
}

async function getServiceActivities() {
  const activities = [];

  try {
    // Get recent service completions
    const recentServices = await prisma.service.findMany({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      select: {
        id: true,
        amount: true,
        customerId: true,
        employeeId: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });

    activities.push(...recentServices.map(service => ({
      id: `service_${service.id}`,
      type: 'SERVICE_COMPLETION',
      title: `Service completed`,
      description: `Service #${service.id} completed for $${service.amount}`,
      severity: 'INFO',
      timestamp: service.updatedAt,
      category: 'SERVICES'
    })));

  } catch (error) {
    console.error('Error getting service activities:', error);
  }

  return activities;
}

async function getPaymentActivities() {
  const activities = [];

  try {
    // Get recent payments
    const recentPayments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      select: {
        id: true,
        amount: true,
        status: true,
        customerId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    activities.push(...recentPayments.map(payment => ({
      id: `payment_${payment.id}`,
      type: 'PAYMENT',
      title: `Payment ${payment.status}`,
      description: `Payment #${payment.id} for $${payment.amount} - ${payment.status}`,
      severity: payment.status === 'SUCCEEDED' ? 'INFO' : 'WARNING',
      timestamp: payment.createdAt,
      category: 'PAYMENTS'
    })));

  } catch (error) {
    console.error('Error getting payment activities:', error);
  }

  return activities;
}

function getActivityCategory(type) {
  const categoryMap = {
    'AUTOMATION_TRIGGER': 'AUTOMATION',
    'AUTOMATION_ERROR': 'AUTOMATION',
    'EMPLOYEE_RECRUITMENT': 'RECRUITMENT',
    'CUSTOMER_ACQUISITION': 'ACQUISITION',
    'BUSINESS_INTELLIGENCE': 'BUSINESS_INTELLIGENCE',
    'SERVICE_CREATION': 'SERVICES',
    'PAYMENT_PROCESSING': 'PAYMENTS',
    'SYSTEM_HEALTH': 'SYSTEM'
  };

  return categoryMap[type] || 'SYSTEM';
}

function groupActivitiesByDate(activities) {
  const grouped = {};
  
  activities.forEach(activity => {
    const date = new Date(activity.timestamp).toDateString();
    
    if (!grouped[date]) {
      grouped[date] = [];
    }
    
    grouped[date].push(activity);
  });

  // Convert to array format and sort dates
  return Object.entries(grouped)
    .map(([date, activities]) => ({
      date,
      activities: activities.slice(0, 20) // Limit activities per day
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
} 

export const GET = withApiSecurity(getHandler, { requireAuth: true, rateLimit: true });