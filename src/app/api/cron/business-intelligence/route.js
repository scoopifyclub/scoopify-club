import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


// This endpoint should be called by a cron job (e.g., Vercel Cron)
// Recommended schedule: Every Sunday at 6:00 AM
export async function POST(request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      weeklyReport: {},
      monthlyReport: {},
      growthAnalysis: {},
      riskAssessment: {},
      recommendations: [],
      alerts: []
    };

    // 1. Generate weekly business report
    results.weeklyReport = await generateWeeklyReport();

    // 2. Generate monthly business report
    results.monthlyReport = await generateMonthlyReport();

    // 3. Analyze growth trends
    results.growthAnalysis = await analyzeGrowthTrends();

    // 4. Assess business risks
    results.riskAssessment = await assessBusinessRisks();

    // 5. Generate actionable recommendations
    results.recommendations = await generateRecommendations(results);

    // 6. Check for critical alerts
    results.alerts = await checkCriticalAlerts();

    // 7. Send comprehensive report to admin
    await sendBusinessIntelligenceReport(results);

    console.log('Business intelligence summary:', results);

    return NextResponse.json({
      success: true,
      results: results
    });

  } catch (error) {
    console.error('Error in business intelligence processing:', error);
    return NextResponse.json(
      { error: 'Failed to process business intelligence' },
      { status: 500 }
    );
  }
}

async function generateWeeklyReport() {
  try {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // Get weekly metrics
    const weeklyMetrics = await getWeeklyMetrics(weekStart, weekEnd);
    
    // Get top performing employees
    const topEmployees = await getTopPerformingEmployees(weekStart, weekEnd);
    
    // Get customer satisfaction metrics
    const satisfactionMetrics = await getCustomerSatisfactionMetrics(weekStart, weekEnd);
    
    // Get financial metrics
    const financialMetrics = await getFinancialMetrics(weekStart, weekEnd);

    return {
      period: {
        start: weekStart.toISOString(),
        end: weekEnd.toISOString()
      },
      metrics: weeklyMetrics,
      topEmployees,
      satisfaction: satisfactionMetrics,
      financial: financialMetrics
    };

  } catch (error) {
    console.error('Error generating weekly report:', error);
    return {};
  }
}

async function generateMonthlyReport() {
  try {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Get monthly metrics
    const monthlyMetrics = await getMonthlyMetrics(monthStart, monthEnd);
    
    // Get market expansion opportunities
    const expansionOpportunities = await getExpansionOpportunities();
    
    // Get competitive analysis
    const competitiveAnalysis = await getCompetitiveAnalysis();
    
    // Get operational efficiency metrics
    const operationalMetrics = await getOperationalMetrics(monthStart, monthEnd);

    return {
      period: {
        start: monthStart.toISOString(),
        end: monthEnd.toISOString()
      },
      metrics: monthlyMetrics,
      expansion: expansionOpportunities,
      competitive: competitiveAnalysis,
      operational: operationalMetrics
    };

  } catch (error) {
    console.error('Error generating monthly report:', error);
    return {};
  }
}

async function getWeeklyMetrics(weekStart, weekEnd) {
  try {
    // Services completed
    const servicesCompleted = await prisma.service.count({
      where: {
        status: 'COMPLETED',
        completedDate: {
          gte: weekStart,
          lte: weekEnd
        }
      }
    });

    // New customers
    const newCustomers = await prisma.customer.count({
      where: {
        createdAt: {
          gte: weekStart,
          lte: weekEnd
        }
      }
    });

    // Revenue generated
    const revenue = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      _sum: {
        amount: true
      }
    });

    // Employee productivity
    const employeeProductivity = await prisma.service.groupBy({
      by: ['employeeId'],
      where: {
        status: 'COMPLETED',
        completedDate: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      _count: {
        id: true
      }
    });

    const avgServicesPerEmployee = employeeProductivity.length > 0 
      ? employeeProductivity.reduce((sum, emp) => sum + emp._count.id, 0) / employeeProductivity.length
      : 0;

    return {
      servicesCompleted,
      newCustomers,
      revenue: revenue._sum.amount || 0,
      avgServicesPerEmployee: Math.round(avgServicesPerEmployee * 100) / 100,
      employeeCount: employeeProductivity.length
    };

  } catch (error) {
    console.error('Error getting weekly metrics:', error);
    return {};
  }
}

async function getMonthlyMetrics(monthStart, monthEnd) {
  try {
    // Monthly growth metrics
    const monthlyGrowth = await getMonthlyGrowthMetrics(monthStart, monthEnd);
    
    // Customer retention metrics
    const retentionMetrics = await getCustomerRetentionMetrics(monthStart, monthEnd);
    
    // Market penetration metrics
    const penetrationMetrics = await getMarketPenetrationMetrics(monthStart, monthEnd);

    return {
      growth: monthlyGrowth,
      retention: retentionMetrics,
      penetration: penetrationMetrics
    };

  } catch (error) {
    console.error('Error getting monthly metrics:', error);
    return {};
  }
}

async function getTopPerformingEmployees(weekStart, weekEnd) {
  try {
    const topEmployees = await prisma.service.groupBy({
      by: ['employeeId'],
      where: {
        status: 'COMPLETED',
        completedDate: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      _count: {
        id: true
      },
      _sum: {
        potentialEarnings: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    // Get employee details
    const employeeDetails = await Promise.all(
      topEmployees.map(async (emp) => {
        const employee = await prisma.employee.findUnique({
          where: { id: emp.employeeId },
          include: {
            user: true
          }
        });

        return {
          employeeId: emp.employeeId,
          name: employee?.user?.name || 'Unknown',
          servicesCompleted: emp._count.id,
          totalEarnings: emp._sum.potentialEarnings || 0,
          avgEarningsPerService: emp._count.id > 0 
            ? (emp._sum.potentialEarnings || 0) / emp._count.id 
            : 0
        };
      })
    );

    return employeeDetails;

  } catch (error) {
    console.error('Error getting top performing employees:', error);
    return [];
  }
}

async function getCustomerSatisfactionMetrics(weekStart, weekEnd) {
  try {
    // Get completed services with ratings
    const servicesWithRatings = await prisma.service.findMany({
      where: {
        status: 'COMPLETED',
        completedDate: {
          gte: weekStart,
          lte: weekEnd
        },
        rating: {
          not: null
        }
      },
      select: {
        rating: true,
        customerFeedback: true
      }
    });

    if (servicesWithRatings.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        satisfactionScore: 0
      };
    }

    const totalRating = servicesWithRatings.reduce((sum, service) => sum + (service.rating || 0), 0);
    const averageRating = totalRating / servicesWithRatings.length;

    // Calculate satisfaction score (0-100)
    const satisfactionScore = Math.round((averageRating / 5) * 100);

    return {
      averageRating: Math.round(averageRating * 100) / 100,
      totalRatings: servicesWithRatings.length,
      satisfactionScore
    };

  } catch (error) {
    console.error('Error getting customer satisfaction metrics:', error);
    return {
      averageRating: 0,
      totalRatings: 0,
      satisfactionScore: 0
    };
  }
}

async function getFinancialMetrics(weekStart, weekEnd) {
  try {
    // Revenue metrics
    const revenue = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      _sum: {
        amount: true
      }
    });

    // Cost metrics (simulated)
    const totalRevenue = revenue._sum.amount || 0;
    const employeePayouts = totalRevenue * 0.75; // 75% to employees
    const platformFees = totalRevenue * 0.029 + (totalRevenue > 0 ? 0.30 : 0); // Stripe fees
    const operationalCosts = totalRevenue * 0.05; // 5% operational costs
    const netProfit = totalRevenue - employeePayouts - platformFees - operationalCosts;

    return {
      totalRevenue,
      employeePayouts,
      platformFees,
      operationalCosts,
      netProfit,
      profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
    };

  } catch (error) {
    console.error('Error getting financial metrics:', error);
    return {};
  }
}

async function analyzeGrowthTrends() {
  try {
    const now = new Date();
    const trends = {
      customerGrowth: [],
      revenueGrowth: [],
      employeeGrowth: [],
      marketExpansion: []
    };

    // Analyze last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(now, i * 7), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(subDays(now, i * 7), { weekStartsOn: 1 });

      // Customer growth
      const newCustomers = await prisma.customer.count({
        where: {
          createdAt: {
            gte: weekStart,
            lte: weekEnd
          }
        }
      });

      // Revenue growth
      const revenue = await prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: weekStart,
            lte: weekEnd
          }
        },
        _sum: {
          amount: true
        }
      });

      trends.customerGrowth.push({
        week: weekStart.toISOString(),
        newCustomers,
        cumulativeCustomers: 0 // Will be calculated
      });

      trends.revenueGrowth.push({
        week: weekStart.toISOString(),
        revenue: revenue._sum.amount || 0
      });
    }

    // Calculate cumulative customers
    let cumulative = 0;
    for (const week of trends.customerGrowth) {
      cumulative += week.newCustomers;
      week.cumulativeCustomers = cumulative;
    }

    return trends;

  } catch (error) {
    console.error('Error analyzing growth trends:', error);
    return {};
  }
}

async function assessBusinessRisks() {
  try {
    const risks = [];

    // Check for coverage gaps
    const coverageRisk = await assessCoverageRisk();
    if (coverageRisk.hasRisk) {
      risks.push(coverageRisk);
    }

    // Check for employee retention risk
    const retentionRisk = await assessEmployeeRetentionRisk();
    if (retentionRisk.hasRisk) {
      risks.push(retentionRisk);
    }

    // Check for customer churn risk
    const churnRisk = await assessCustomerChurnRisk();
    if (churnRisk.hasRisk) {
      risks.push(churnRisk);
    }

    // Check for financial risk
    const financialRisk = await assessFinancialRisk();
    if (financialRisk.hasRisk) {
      risks.push(financialRisk);
    }

    return {
      totalRisks: risks.length,
      highPriorityRisks: risks.filter(r => r.priority === 'HIGH').length,
      risks: risks
    };

  } catch (error) {
    console.error('Error assessing business risks:', error);
    return { totalRisks: 0, highPriorityRisks: 0, risks: [] };
  }
}

async function assessCoverageRisk() {
  try {
    // Get customer zip codes without coverage
    const customerZips = await prisma.customer.findMany({
      where: { status: 'ACTIVE' },
      select: { zipCode: true },
      distinct: ['zipCode']
    });

    const coveredZips = await prisma.coverageArea.findMany({
      where: { active: true },
      select: { zipCode: true },
      distinct: ['zipCode']
    });

    const customerZipSet = new Set(customerZips.map(c => c.zipCode));
    const coveredZipSet = new Set(coveredZips.map(c => c.zipCode));
    const uncoveredZips = Array.from(customerZipSet).filter(zip => !coveredZipSet.has(zip));

    if (uncoveredZips.length > 0) {
      return {
        type: 'COVERAGE_GAP',
        priority: uncoveredZips.length > 5 ? 'HIGH' : 'MEDIUM',
        hasRisk: true,
        description: `${uncoveredZips.length} zip codes have customers but no coverage`,
        affectedCustomers: await prisma.customer.count({
          where: {
            zipCode: { in: uncoveredZips },
            status: 'ACTIVE'
          }
        }),
        recommendation: 'Recruit employees in uncovered areas immediately'
      };
    }

    return { hasRisk: false };

  } catch (error) {
    console.error('Error assessing coverage risk:', error);
    return { hasRisk: false };
  }
}

async function assessEmployeeRetentionRisk() {
  try {
    // Check for employees with declining performance
    const lastMonth = subDays(new Date(), 30);
    const twoMonthsAgo = subDays(new Date(), 60);

    const recentPerformance = await prisma.service.groupBy({
      by: ['employeeId'],
      where: {
        status: 'COMPLETED',
        completedDate: { gte: lastMonth }
      },
      _count: { id: true }
    });

    const previousPerformance = await prisma.service.groupBy({
      by: ['employeeId'],
      where: {
        status: 'COMPLETED',
        completedDate: { gte: twoMonthsAgo, lt: lastMonth }
      },
      _count: { id: true }
    });

    const atRiskEmployees = [];
    for (const recent of recentPerformance) {
      const previous = previousPerformance.find(p => p.employeeId === recent.employeeId);
      if (previous && recent._count.id < previous._count.id * 0.7) { // 30% decline
        atRiskEmployees.push(recent.employeeId);
      }
    }

    if (atRiskEmployees.length > 0) {
      return {
        type: 'EMPLOYEE_RETENTION',
        priority: atRiskEmployees.length > 3 ? 'HIGH' : 'MEDIUM',
        hasRisk: true,
        description: `${atRiskEmployees.length} employees showing declining performance`,
        affectedEmployees: atRiskEmployees.length,
        recommendation: 'Implement employee engagement program and performance coaching'
      };
    }

    return { hasRisk: false };

  } catch (error) {
    console.error('Error assessing employee retention risk:', error);
    return { hasRisk: false };
  }
}

async function assessCustomerChurnRisk() {
  try {
    // Check for customers with missed payments or declining engagement
    const lastMonth = subDays(new Date(), 30);
    
    const customersWithFailedPayments = await prisma.payment.count({
      where: {
        status: 'FAILED',
        createdAt: { gte: lastMonth }
      }
    });

    const inactiveCustomers = await prisma.customer.count({
      where: {
        status: 'ACTIVE',
        updatedAt: { lt: lastMonth }
      }
    });

    const totalActiveCustomers = await prisma.customer.count({
      where: { status: 'ACTIVE' }
    });

    const churnRiskPercentage = totalActiveCustomers > 0 
      ? ((customersWithFailedPayments + inactiveCustomers) / totalActiveCustomers) * 100 
      : 0;

    if (churnRiskPercentage > 10) { // 10% churn risk threshold
      return {
        type: 'CUSTOMER_CHURN',
        priority: churnRiskPercentage > 20 ? 'HIGH' : 'MEDIUM',
        hasRisk: true,
        description: `${churnRiskPercentage.toFixed(1)}% of customers at risk of churning`,
        failedPayments: customersWithFailedPayments,
        inactiveCustomers,
        recommendation: 'Implement customer retention program and payment recovery'
      };
    }

    return { hasRisk: false };

  } catch (error) {
    console.error('Error assessing customer churn risk:', error);
    return { hasRisk: false };
  }
}

async function assessFinancialRisk() {
  try {
    // Check for declining revenue trends
    const lastWeek = subDays(new Date(), 7);
    const twoWeeksAgo = subDays(new Date(), 14);

    const recentRevenue = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: lastWeek }
      },
      _sum: { amount: true }
    });

    const previousRevenue = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: twoWeeksAgo, lt: lastWeek }
      },
      _sum: { amount: true }
    });

    const recentAmount = recentRevenue._sum.amount || 0;
    const previousAmount = previousRevenue._sum.amount || 0;

    if (previousAmount > 0 && recentAmount < previousAmount * 0.8) { // 20% decline
      return {
        type: 'REVENUE_DECLINE',
        priority: recentAmount < previousAmount * 0.6 ? 'HIGH' : 'MEDIUM',
        hasRisk: true,
        description: `Revenue declined by ${((previousAmount - recentAmount) / previousAmount * 100).toFixed(1)}%`,
        recentRevenue: recentAmount,
        previousRevenue: previousAmount,
        recommendation: 'Investigate revenue decline and implement growth strategies'
      };
    }

    return { hasRisk: false };

  } catch (error) {
    console.error('Error assessing financial risk:', error);
    return { hasRisk: false };
  }
}

async function generateRecommendations(results) {
  const recommendations = [];

  // Based on weekly report
  if (results.weeklyReport.metrics) {
    const metrics = results.weeklyReport.metrics;
    
    if (metrics.avgServicesPerEmployee < 10) {
      recommendations.push({
        priority: 'HIGH',
        category: 'OPERATIONS',
        title: 'Increase Employee Productivity',
        description: 'Average services per employee is below target. Consider training and incentives.',
        impact: 'HIGH',
        effort: 'MEDIUM'
      });
    }

    if (metrics.newCustomers < 5) {
      recommendations.push({
        priority: 'HIGH',
        category: 'GROWTH',
        title: 'Boost Customer Acquisition',
        description: 'New customer signups are low. Increase marketing efforts.',
        impact: 'HIGH',
        effort: 'HIGH'
      });
    }
  }

  // Based on risk assessment
  if (results.riskAssessment.risks) {
    for (const risk of results.riskAssessment.risks) {
      recommendations.push({
        priority: risk.priority,
        category: 'RISK_MITIGATION',
        title: `Address ${risk.type.replace('_', ' ')}`,
        description: risk.recommendation,
        impact: 'HIGH',
        effort: 'MEDIUM'
      });
    }
  }

  // Based on growth trends
  if (results.growthAnalysis.customerGrowth) {
    const recentWeeks = results.growthAnalysis.customerGrowth.slice(-4);
    const avgGrowth = recentWeeks.reduce((sum, week) => sum + week.newCustomers, 0) / recentWeeks.length;
    
    if (avgGrowth < 3) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'GROWTH',
        title: 'Optimize Customer Growth Strategy',
        description: 'Customer growth rate is below target. Review marketing channels and conversion rates.',
        impact: 'MEDIUM',
        effort: 'HIGH'
      });
    }
  }

  return recommendations;
}

async function checkCriticalAlerts() {
  const alerts = [];

  try {
    // Check for immediate coverage issues
    const uncoveredCustomers = await prisma.customer.count({
      where: {
        status: 'ACTIVE',
        zipCode: {
          notIn: await prisma.coverageArea.findMany({
            where: { active: true },
            select: { zipCode: true }
          }).then(zips => zips.map(z => z.zipCode))
        }
      }
    });

    if (uncoveredCustomers > 0) {
      alerts.push({
        type: 'CRITICAL',
        title: 'Customers Without Coverage',
        message: `${uncoveredCustomers} customers are in areas without active employees`,
        action: 'URGENT_RECRUITMENT_NEEDED'
      });
    }

    // Check for payment failures
    const recentFailedPayments = await prisma.payment.count({
      where: {
        status: 'FAILED',
        createdAt: { gte: subDays(new Date(), 3) }
      }
    });

    if (recentFailedPayments > 5) {
      alerts.push({
        type: 'WARNING',
        title: 'High Payment Failure Rate',
        message: `${recentFailedPayments} payment failures in the last 3 days`,
        action: 'REVIEW_PAYMENT_PROCESSES'
      });
    }

  } catch (error) {
    console.error('Error checking critical alerts:', error);
  }

  return alerts;
}

async function sendBusinessIntelligenceReport(results) {
  try {
    // Create comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        weeklyMetrics: results.weeklyReport.metrics,
        monthlyMetrics: results.monthlyReport.metrics,
        risks: results.riskAssessment.totalRisks,
        recommendations: results.recommendations.length
      },
      details: results
    };

    // Store report in database
    await prisma.businessReport.create({
      data: {
        reportData: report,
        type: 'WEEKLY_INTELLIGENCE',
        generatedAt: new Date()
      }
    });

    // Send email notification to admin
    await sendEmailNotification({
      to: 'admin@scoopify.club',
      subject: 'Weekly Business Intelligence Report',
      template: 'business-intelligence-report',
      data: {
        report: report,
        summary: report.summary
      }
    });

    console.log('Business intelligence report sent');

  } catch (error) {
    console.error('Error sending business intelligence report:', error);
  }
}

async function sendEmailNotification({ to, subject, template, data }) {
  try {
    // This would integrate with your email service
    console.log(`Sending ${template} email to ${to}`);
    console.log('Email data:', { subject, template, data });
    
  } catch (error) {
    console.error('Error sending email notification:', error);
    throw error;
  }
} 