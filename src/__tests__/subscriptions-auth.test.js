/**
 * @jest-environment node
 *
 * Regression for triage B5: anon GET /api/subscriptions used to call
 * undefined getServerSession/authOptions and return 500. Must fail closed.
 */
process.env.JWT_SECRET = 'subscriptions-auth-test-secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';

const mockCookieJar = new Map();

jest.mock('@/lib/prisma', () => {
  const prisma = {
    customer: {
      findUnique: jest.fn(),
    },
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
  validateUser: jest.fn(),
}));

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    subscriptions: { cancel: jest.fn() },
  }));
});

const { validateUser } = require('@/lib/api-auth');
const { prisma } = require('@/lib/prisma');
const subscriptionsRoute = require('@/app/api/subscriptions/route');

beforeEach(() => {
  jest.clearAllMocks();
  mockCookieJar.clear();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('GET /api/subscriptions auth', () => {
  it('returns 401 for anonymous requests (no cookie)', async () => {
    const res = await subscriptionsRoute.GET();
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Unauthorized' });
    expect(validateUser).not.toHaveBeenCalled();
    expect(prisma.customer.findUnique).not.toHaveBeenCalled();
  });

  it('returns 401 for an invalid access token', async () => {
    mockCookieJar.set('accessToken', 'bogus-token');
    validateUser.mockResolvedValueOnce(null);

    const res = await subscriptionsRoute.GET();
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Unauthorized' });
    expect(prisma.customer.findUnique).not.toHaveBeenCalled();
  });
});
