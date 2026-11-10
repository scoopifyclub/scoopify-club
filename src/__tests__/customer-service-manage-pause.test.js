/**
 * @jest-environment node
 *
 * Regression for triage B4: pause/resume on customer/services/[id]/manage
 * must not write nonexistent ServiceStatus.PAUSED (or servicePause models).
 * Billing changes are handed to Stripe Customer Portal.
 */
import { NextRequest } from 'next/server';

process.env.JWT_SECRET = 'customer-manage-pause-test-secret';
process.env.NEXT_PUBLIC_APP_URL = 'https://www.scoopify.club';
process.env.STRIPE_SECRET_KEY = 'sk_test_manage_pause';

const mockBillingPortalCreate = jest.fn();

jest.mock('@/lib/prisma', () => {
  const prisma = {
    customer: {
      findUnique: jest.fn(),
    },
    service: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    servicePause: {
      create: jest.fn(),
    },
    serviceResume: {
      create: jest.fn(),
    },
  };
  return { __esModule: true, prisma, default: prisma };
});

jest.mock('@/lib/api-auth', () => ({
  getUserFromToken: jest.fn(async () => ({
    userId: 'user_1',
    role: 'CUSTOMER',
  })),
}));

jest.mock('@/lib/stripe', () => ({
  stripe: {
    billingPortal: {
      sessions: {
        create: (...args) => mockBillingPortalCreate(...args),
      },
    },
  },
}));

const { prisma } = require('@/lib/prisma');
const { getUserFromToken } = require('@/lib/api-auth');
const manageRoute = require('@/app/api/customer/services/[id]/manage/route');

const SERVICE_ID = 'svc_manage_1';
const futureDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  return d;
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  prisma.customer.findUnique.mockResolvedValue({
    id: 'cust_1',
    stripeCustomerId: 'cus_test_1',
  });
  prisma.service.findFirst.mockResolvedValue({
    id: SERVICE_ID,
    customerId: 'cust_1',
    status: 'SCHEDULED',
    scheduledDate: futureDate(),
    subscriptionId: 'sub_1',
    employee: null,
    servicePlan: null,
  });
  mockBillingPortalCreate.mockResolvedValue({
    url: 'https://billing.stripe.com/session/test_portal',
  });
});

afterEach(() => jest.restoreAllMocks());

function putManage(action) {
  const req = new NextRequest(
    `http://localhost:3000/api/customer/services/${SERVICE_ID}/manage`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    }
  );
  return manageRoute.PUT(req, { params: Promise.resolve({ id: SERVICE_ID }) });
}

describe('customer service manage pause/resume → Stripe portal', () => {
  it('pause returns a portal URL and never writes Service.status PAUSED', async () => {
    const res = await putManage('pause');
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.usePortal).toBe(true);
    expect(body.url).toBe('https://billing.stripe.com/session/test_portal');
    expect(mockBillingPortalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_test_1',
        return_url: expect.stringContaining('/customer/dashboard?tab=billing'),
      })
    );
    expect(prisma.service.update).not.toHaveBeenCalled();
    expect(prisma.servicePause.create).not.toHaveBeenCalled();
  });

  it('resume returns a portal URL and never writes Service.status', async () => {
    const res = await putManage('resume');
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.usePortal).toBe(true);
    expect(body.url).toContain('billing.stripe.com');
    expect(prisma.service.update).not.toHaveBeenCalled();
    expect(prisma.serviceResume.create).not.toHaveBeenCalled();
  });

  it('pause without Stripe customer returns 400 instead of 500', async () => {
    prisma.customer.findUnique.mockResolvedValue({
      id: 'cust_1',
      stripeCustomerId: null,
    });

    const res = await putManage('pause');
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.usePortal).toBe(true);
    expect(body.error).toMatch(/Stripe customer/i);
    expect(prisma.service.update).not.toHaveBeenCalled();
  });

  it('unauthorized requests get 401', async () => {
    getUserFromToken.mockResolvedValueOnce(null);
    const res = await putManage('pause');
    expect(res.status).toBe(401);
  });
});
