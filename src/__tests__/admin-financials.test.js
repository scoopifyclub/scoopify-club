/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

process.env.JWT_SECRET = 'admin-financials-test-secret';

const mockRequireAdmin = jest.fn(async () => ({
  ok: true,
  user: { id: 'admin_1', email: 'owner@scoopify.club', role: 'ADMIN' },
}));

jest.mock('@/lib/admin-auth', () => ({
  requireAdmin: (...args) => mockRequireAdmin(...args),
}));

jest.mock('@/lib/prisma', () => {
  const prisma = {
    jobFinancialRecord: {
      count: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    payoutHold: { findMany: jest.fn() },
    payout: { findMany: jest.fn() },
    payoutAdjustment: { aggregate: jest.fn() },
  };
  return { __esModule: true, prisma, default: prisma };
});

jest.mock('@/lib/payout-reconciliation', () => ({
  payoutReconciliation: jest.fn(),
}));

jest.mock('@/lib/stripe-connect', () => ({
  getStripe: jest.fn(() => null),
}));

const { prisma } = require('@/lib/prisma');
const { parseFinancialDateRange, listJobFinancialRecords, financialOpsSnapshot } = require('@/lib/admin-financials');
const financialsRoute = require('@/app/api/admin/financials/route');
const jobsRoute = require('@/app/api/admin/financials/jobs/route');
const holdsRoute = require('@/app/api/admin/payouts/holds/route');
const reconciliationRoute = require('@/app/api/admin/payouts/reconciliation/route');
const { payoutReconciliation } = require('@/lib/payout-reconciliation');

function request(path, { method = 'GET', body, admin = true } = {}) {
  if (!admin) {
    mockRequireAdmin.mockResolvedValueOnce({
      ok: false,
      status: 401,
      error: 'Unauthorized',
      response: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    });
  }
  const headers = new Headers({ 'content-type': 'application/json' });
  return new NextRequest(`http://localhost:3000${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireAdmin.mockResolvedValue({
    ok: true,
    user: { id: 'admin_1', email: 'owner@scoopify.club', role: 'ADMIN' },
  });
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('parseFinancialDateRange', () => {
  it('defaults to the last 28 Denver days and rejects inverted ranges', () => {
    const range = parseFinancialDateRange({ now: new Date('2026-11-10T18:00:00Z') });
    expect(range.from).toBe('2026-10-14');
    expect(range.to).toBe('2026-11-10');
    expect(() => parseFinancialDateRange({ from: '2026-11-10', to: '2026-11-01' })).toThrow(/from must be on or before to/);
    expect(() => parseFinancialDateRange({ from: '11-10-2026' })).toThrow(/YYYY-MM-DD/);
  });
});

describe('listJobFinancialRecords', () => {
  it('returns revenue / scooper / fee / keep dollars and filter totals', async () => {
    prisma.jobFinancialRecord.count.mockResolvedValue(1);
    prisma.jobFinancialRecord.aggregate.mockResolvedValue({
      _count: 1,
      _sum: {
        customerPriceCents: 1823,
        scooperEarningCents: 1367,
        stripeFeeCents: 83,
        retainedContributionCents: 373,
        referralExpenseCents: 0,
      },
    });
    prisma.jobFinancialRecord.findMany.mockResolvedValue([
      {
        id: 'fin_1',
        serviceId: 'svc_1',
        customerId: 'cus_1',
        employeeId: 'emp_1',
        subscriptionId: 'sub_1',
        servicePlanId: 'plan_1',
        pricingBasis: 'SUBSCRIPTION_WEEKLY',
        planPriceCents: 7900,
        customerPriceCents: 1823,
        scooperEarningCents: 1367,
        referralExpenseCents: 0,
        stripeFeeCents: 83,
        stripeFeeEstimated: true,
        retainedContributionCents: 373,
        adjustments: [],
        checkedInAt: null,
        completedAt: new Date('2026-11-05T17:00:00Z'),
        serviceDurationSeconds: null,
        payoutStatus: 'PENDING',
        stripeTransferId: null,
        paidAt: null,
        payoutId: null,
        holdReason: null,
        createdAt: new Date('2026-11-05T17:00:00Z'),
        updatedAt: new Date('2026-11-05T17:00:00Z'),
        service: {
          id: 'svc_1',
          status: 'COMPLETED',
          serviceDate: new Date('2026-11-05'),
          customer: { id: 'cus_1', user: { firstName: 'Pat', lastName: 'Customer', email: 'pat@example.com' } },
          employee: {
            id: 'emp_1',
            stripePayoutsEnabled: true,
            user: { firstName: 'Sam', lastName: 'Scooper', email: 'sam@example.com' },
          },
          servicePlan: { id: 'plan_1', name: 'Weekly 1 Dog', type: 'MONTHLY' },
        },
        payout: null,
      },
    ]);

    const result = await listJobFinancialRecords({
      from: '2026-11-01',
      to: '2026-11-10',
      payoutStatus: 'PENDING',
    });

    expect(result.records).toHaveLength(1);
    expect(result.records[0]).toMatchObject({
      revenue: 18.23,
      scooperShare: 13.67,
      stripeFees: 0.83,
      scoopifyKeep: 3.73,
      customerName: 'Pat Customer',
      scooperName: 'Sam Scooper',
      payoutStatus: 'PENDING',
    });
    expect(result.totals).toEqual({
      jobs: 1,
      revenue: 18.23,
      scooperShare: 13.67,
      stripeFees: 0.83,
      scoopifyKeep: 3.73,
      referralExpense: 0,
    });
    expect(prisma.jobFinancialRecord.findMany.mock.calls[0][0].where.payoutStatus).toBe('PENDING');
  });

  it('rejects unknown payout statuses', async () => {
    await expect(listJobFinancialRecords({ payoutStatus: 'NOPE' })).rejects.toMatchObject({ status: 400 });
  });
});

describe('financialOpsSnapshot', () => {
  it('summarizes job economics, owed balances, holds and payouts', async () => {
    prisma.jobFinancialRecord.aggregate.mockResolvedValue({
      _count: 2,
      _sum: {
        customerPriceCents: 3646,
        scooperEarningCents: 2734,
        stripeFeeCents: 166,
        retainedContributionCents: 746,
        referralExpenseCents: 0,
      },
    });
    prisma.jobFinancialRecord.groupBy
      .mockResolvedValueOnce([
        { payoutStatus: 'PENDING', _count: 1, _sum: { scooperEarningCents: 1367 } },
        { payoutStatus: 'PAID', _count: 1, _sum: { scooperEarningCents: 1367 } },
      ])
      .mockResolvedValueOnce([
        { payoutStatus: 'PENDING', _count: 3, _sum: { scooperEarningCents: 4101 } },
        { payoutStatus: 'HELD', _count: 1, _sum: { scooperEarningCents: 1367 } },
      ]);
    prisma.payoutHold.findMany.mockResolvedValue([
      {
        id: 'hold_1',
        reason: 'DISPUTE',
        status: 'OPEN',
        customerId: 'cus_1',
        serviceId: null,
        amount: 55,
        note: null,
        createdAt: new Date('2026-11-08T12:00:00Z'),
        stripeObjectId: 'dp_1',
      },
    ]);
    prisma.payout.findMany.mockResolvedValue([
      {
        id: 'pay_1',
        employeeId: 'emp_1',
        amount: 27.34,
        netAmount: 27.34,
        status: 'PAID',
        serviceCount: 2,
        weekStart: new Date('2026-10-27T06:00:00Z'),
        weekEnd: new Date('2026-11-03T06:00:00Z'),
        requestedAt: new Date('2026-11-07T18:00:00Z'),
        processedAt: new Date('2026-11-07T18:01:00Z'),
        stripeTransferId: 'tr_1',
        failureReason: null,
        paymentMethod: 'STRIPE_CONNECT',
        employee: { id: 'emp_1', user: { firstName: 'Sam', lastName: 'Scooper', email: 'sam@example.com' } },
      },
    ]);
    prisma.payoutAdjustment.aggregate.mockResolvedValue({
      _count: 1,
      _sum: { amountCents: -500 },
    });

    const snapshot = await financialOpsSnapshot({ from: '2026-11-01', to: '2026-11-10' });
    expect(snapshot.jobEconomics.revenue).toBe(36.46);
    expect(snapshot.jobEconomics.scoopifyKeep).toBe(7.46);
    expect(snapshot.owedToScoopers.pending).toEqual({ count: 3, amount: 41.01 });
    expect(snapshot.owedToScoopers.held).toEqual({ count: 1, amount: 13.67 });
    expect(snapshot.owedToScoopers.openHolds).toBe(1);
    expect(snapshot.owedToScoopers.adjustments).toEqual({ count: 1, amount: -5 });
    expect(snapshot.recentPayouts[0].scooperName).toBe('Sam Scooper');
  });
});

describe('admin financial API routes', () => {
  it('rejects anonymous callers on snapshot and jobs endpoints', async () => {
    const snapshotRes = await financialsRoute.GET(request('/api/admin/financials', { admin: false }));
    expect(snapshotRes.status).toBe(401);

    const jobsRes = await jobsRoute.GET(request('/api/admin/financials/jobs', { admin: false }));
    expect(jobsRes.status).toBe(401);
  });

  it('returns 400 for bad dates on the jobs route', async () => {
    const res = await jobsRoute.GET(request('/api/admin/financials/jobs?from=nope&to=2026-11-10'));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: expect.stringMatching(/YYYY-MM-DD/) });
  });

  it('serves the jobs list for an allowlisted admin', async () => {
    prisma.jobFinancialRecord.count.mockResolvedValue(0);
    prisma.jobFinancialRecord.findMany.mockResolvedValue([]);
    prisma.jobFinancialRecord.aggregate.mockResolvedValue({
      _count: 0,
      _sum: {
        customerPriceCents: null,
        scooperEarningCents: null,
        stripeFeeCents: null,
        retainedContributionCents: null,
        referralExpenseCents: null,
      },
    });

    const res = await jobsRoute.GET(
      request('/api/admin/financials/jobs?from=2026-11-01&to=2026-11-10&payoutStatus=PAID'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pagination.total).toBe(0);
    expect(body.filters.payoutStatus).toBe('PAID');
    expect(mockRequireAdmin).toHaveBeenCalled();
  });

  it('serves the ops snapshot for an allowlisted admin', async () => {
    prisma.jobFinancialRecord.aggregate.mockResolvedValue({
      _count: 0,
      _sum: {
        customerPriceCents: null,
        scooperEarningCents: null,
        stripeFeeCents: null,
        retainedContributionCents: null,
        referralExpenseCents: null,
      },
    });
    prisma.jobFinancialRecord.groupBy.mockResolvedValue([]);
    prisma.payoutHold.findMany.mockResolvedValue([]);
    prisma.payout.findMany.mockResolvedValue([]);
    prisma.payoutAdjustment.aggregate.mockResolvedValue({ _count: 0, _sum: { amountCents: null } });

    const res = await financialsRoute.GET(request('/api/admin/financials?from=2026-11-01&to=2026-11-10'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.jobEconomics.jobsCompleted).toBe(0);
    expect(body.owedToScoopers.openHolds).toBe(0);
  });

  it('keeps existing payout holds and reconciliation routes behind requireAdmin', async () => {
    prisma.payoutHold.findMany.mockResolvedValue([]);
    const holdsRes = await holdsRoute.GET(request('/api/admin/payouts/holds', { admin: false }));
    expect(holdsRes.status).toBe(401);

    payoutReconciliation.mockResolvedValue({ issues: [], range: { from: '2026-11-01', to: '2026-11-10' } });
    const reconRes = await reconciliationRoute.GET(
      request('/api/admin/payouts/reconciliation?from=2026-11-01&to=2026-11-10&stripe=0'),
    );
    expect(reconRes.status).toBe(200);
    expect(mockRequireAdmin).toHaveBeenCalled();
  });
});
