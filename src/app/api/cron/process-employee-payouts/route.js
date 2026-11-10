import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCronOrAdmin } from '@/lib/cron-auth';
import { addDays, localDateString, weekStartOf, zonedTimeToUtc } from '@/lib/business-time';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Automatic scooper payouts are NOT implemented. This route used to create
// Payout rows, mark services PAID and notify scoopers using a mocked Stripe
// transfer, so it reported money as paid that was never sent. Until real
// Stripe Connect transfers exist it only reports what is owed for the last
// Denver week (completed services still paymentStatus PENDING) and records
// that report in SystemLog. It moves no money and changes no Service,
// Earning or Payout rows.
const PAYOUTS_ENABLED = false;

async function handle(request) {
  const auth = await requireCronOrAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const thisWeek = weekStartOf(localDateString(new Date()));
    const lastWeek = addDays(thisWeek, -7);
    const weekStart = zonedTimeToUtc(lastWeek);
    const weekEnd = zonedTimeToUtc(thisWeek);

    const services = await prisma.service.findMany({
      where: {
        status: 'COMPLETED',
        employeeId: { not: null },
        paymentStatus: 'PENDING',
        completedDate: { gte: weekStart, lt: weekEnd },
      },
      select: {
        id: true,
        potentialEarnings: true,
        employee: {
          select: {
            id: true,
            stripeConnectAccountId: true,
            cashAppUsername: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    const byEmployee = new Map();
    for (const service of services) {
      const employee = service.employee;
      const entry = byEmployee.get(employee.id) || {
        employeeId: employee.id,
        employeeName: [employee.user?.firstName, employee.user?.lastName].filter(Boolean).join(' ') || null,
        email: employee.user?.email || null,
        hasStripeConnect: Boolean(employee.stripeConnectAccountId),
        cashAppUsername: employee.cashAppUsername || null,
        serviceCount: 0,
        amountOwed: 0,
        servicesMissingEarnings: 0,
      };
      entry.serviceCount++;
      if (service.potentialEarnings == null) entry.servicesMissingEarnings++;
      entry.amountOwed = Math.round((entry.amountOwed + (service.potentialEarnings || 0)) * 100) / 100;
      byEmployee.set(employee.id, entry);
    }
    const owed = [...byEmployee.values()];
    const totalOwed = Math.round(owed.reduce((sum, e) => sum + e.amountOwed, 0) * 100) / 100;
    const week = { start: lastWeek, end: addDays(thisWeek, -1), timeZone: 'America/Denver' };
    const message = 'Automatic payouts are not enabled. Nothing was paid; pay these scoopers manually and record it.';

    try {
      await prisma.systemLog.create({
        data: {
          type: 'PAYOUT_REPORT',
          message: `Payout report for ${week.start}..${week.end}: $${totalOwed.toFixed(2)} owed to ${owed.length} scooper(s). ${message}`,
          data: { week, totalOwed, owed },
        },
      });
    } catch (error) {
      console.error('Failed to record payout report:', error);
    }

    console.log(`Payout report ${week.start}..${week.end}: $${totalOwed.toFixed(2)} owed to ${owed.length} scooper(s); payouts disabled`);

    return NextResponse.json({
      success: true,
      payoutsEnabled: PAYOUTS_ENABLED,
      mode: 'report-only',
      message,
      week,
      summary: {
        employeesOwed: owed.length,
        servicesUnpaid: services.length,
        totalOwed,
      },
      owed,
    });
  } catch (error) {
    console.error('Error building employee payout report:', error);
    return NextResponse.json(
      { error: 'Failed to build employee payout report' },
      { status: 500 }
    );
  }
}

export const GET = handle;
export const POST = handle;
