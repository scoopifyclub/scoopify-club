/**
 * @jest-environment node
 *
 * Regression for triage B3: customer/services/[id] and cancel used to
 * destructure `id` from params but query undefined `serviceId`.
 */
import { NextRequest } from 'next/server';

process.env.JWT_SECRET = 'customer-service-id-test-secret';

const mockCookieJar = new Map();

jest.mock('@/lib/prisma', () => {
  const prisma = {
    service: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    serviceDelay: {
      create: jest.fn(),
    },
    $transaction: jest.fn(async (fn) => fn(prisma)),
  };
  return { __esModule: true, prisma, default: prisma };
});

jest.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name) =>
      mockCookieJar.has(name) ? { name, value: mockCookieJar.get(name) } : undefined,
  }),
}));

jest.mock('@/lib/api-auth', () => ({
  validateUser: jest.fn(async () => ({ userId: 'user_1', role: 'CUSTOMER', customerId: 'cust_1' })),
  verifyToken: jest.fn(async () => ({ userId: 'user_1', role: 'CUSTOMER' })),
}));

const { prisma } = require('@/lib/prisma');
const detailRoute = require('@/app/api/customer/services/[id]/route');
const cancelRoute = require('@/app/api/customer/services/[id]/cancel/route');

const SERVICE_ID = 'svc_route_param_1';
const futureDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCookieJar.clear();
  mockCookieJar.set('accessToken', 'test-token');
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('customer service [id] param wiring', () => {
  it('GET detail looks up the route param id, not an undefined serviceId', async () => {
    prisma.service.findUnique.mockResolvedValue({
      id: SERVICE_ID,
      status: 'SCHEDULED',
      customer: { userId: 'user_1' },
      employee: null,
      servicePlan: null,
      location: null,
      serviceArea: null,
      checklist: null,
      delays: [],
      timeExtensions: [],
      photos: [],
      payments: [],
    });

    const req = new NextRequest(`http://localhost:3000/api/customer/services/${SERVICE_ID}`);
    const res = await detailRoute.GET(req, { params: Promise.resolve({ id: SERVICE_ID }) });

    expect(res.status).toBe(200);
    expect(prisma.service.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: SERVICE_ID },
      }),
    );
    expect(prisma.service.findUnique.mock.calls[0][0].where.id).not.toBeUndefined();
  });

  it('POST cancel looks up and updates the route param id', async () => {
    const scheduled = {
      id: SERVICE_ID,
      status: 'SCHEDULED',
      scheduledDate: futureDate(),
      customer: { userId: 'user_1' },
      employee: null,
    };
    prisma.service.findUnique.mockResolvedValue(scheduled);
    prisma.service.update.mockResolvedValue({ ...scheduled, status: 'CANCELLED' });
    prisma.serviceDelay.create.mockResolvedValue({ id: 'delay_1' });

    const req = new NextRequest(`http://localhost:3000/api/customer/services/${SERVICE_ID}/cancel`, {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token' },
    });
    const res = await cancelRoute.POST(req, { params: Promise.resolve({ id: SERVICE_ID }) });

    expect(res.status).toBe(200);
    expect(prisma.service.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: SERVICE_ID },
      }),
    );
    expect(prisma.service.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: SERVICE_ID },
        data: expect.objectContaining({ status: 'CANCELLED' }),
      }),
    );
    expect(prisma.serviceDelay.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          serviceId: SERVICE_ID,
          type: 'CUSTOMER_CANCEL',
          reportedById: 'user_1',
        }),
      }),
    );
  });
});
