/**
 * @jest-environment node
 */
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

const JWT_SECRET = 'admin-access-test-secret';
const LEAKED_OLD_SECRET = 'scoopify-leaked-early-secret';
const ADMIN_EMAIL = 'owner@scoopify.club';
const ADMIN_PASSWORD = 'Admin!Passw0rd';

process.env.JWT_SECRET = JWT_SECRET;
process.env.ADMIN_EMAILS = `${ADMIN_EMAIL}, second-admin@scoopify.club`;
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';

const mockDb = { users: new Map() };

jest.mock('@/lib/prisma', () => {
  const pick = (row, select) => {
    if (!row) return null;
    if (!select) return { ...row };
    return Object.fromEntries(Object.keys(select).filter((k) => select[k]).map((k) => [k, row[k]]));
  };
  const prisma = {
    user: {
      findUnique: jest.fn(async ({ where, select }) => {
        const row = where.id
          ? mockDb.users.get(where.id)
          : [...mockDb.users.values()].find((u) => u.email === where.email);
        return pick(row, select);
      }),
      create: jest.fn(async ({ data }) => {
        mockDb.users.set(data.id, { ...data });
        return { ...data };
      }),
    },
    employee: { create: jest.fn(async ({ data }) => ({ ...data })) },
    customer: {
      create: jest.fn(async ({ data }) => ({ ...data })),
      delete: jest.fn(async () => ({})),
    },
    coverageArea: { create: jest.fn(async ({ data }) => ({ ...data })) },
    $transaction: jest.fn(async (fn) => fn(prisma)),
  };
  return {
    __esModule: true,
    prisma,
    default: prisma,
    withAdminDatabase: (fn) => fn(prisma),
    withDatabase: (fn) => fn(prisma),
  };
});

const mockRequestScope = { headers: new Headers(), cookies: new Map() };
jest.mock('next/headers', () => ({
  headers: async () => mockRequestScope.headers,
  cookies: async () => ({
    get: (name) => (mockRequestScope.cookies.has(name) ? { name, value: mockRequestScope.cookies.get(name) } : undefined),
    set: jest.fn(),
  }),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn((url) => {
    const error = new Error('NEXT_REDIRECT');
    error.url = url;
    throw error;
  }),
}));

const { prisma } = require('@/lib/prisma');
const { createUserToken } = require('@/lib/jwt-utils');
const { requireAdmin } = require('@/lib/admin-auth');
const { middleware } = require('@/middleware');
const adminVerifyRoute = require('@/app/api/admin/verify/route');
const adminCustomersRoute = require('@/app/api/admin/customers/route');
const adminLoginRoute = require('@/app/api/admin/login/route');
const signupRoute = require('@/app/api/auth/signup/route');
const AdminLayout = require('@/app/admin/layout').default;

const BASE = 'http://localhost:3000';
let ipCounter = 0;

function request(path, { method = 'GET', token, cookie = 'accessToken', body, headers = {} } = {}) {
  const h = new Headers({ 'x-forwarded-for': `10.0.0.${++ipCounter}`, ...headers });
  if (token) h.set('cookie', `${cookie}=${token}`);
  if (body !== undefined) h.set('content-type', 'application/json');
  return new NextRequest(`${BASE}${path}`, {
    method,
    headers: h,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function signRaw(payload, secret = JWT_SECRET) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secret));
}

function addUser(user) {
  mockDb.users.set(user.id, { emailVerified: true, firstName: 'Test', lastName: 'User', ...user });
  return mockDb.users.get(user.id);
}

let admin, customer, scooper, rogueAdmin;

beforeEach(() => {
  mockDb.users.clear();
  jest.clearAllMocks();
  mockRequestScope.headers = new Headers();
  mockRequestScope.cookies = new Map();
  const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 4);
  admin = addUser({ id: 'admin-1', email: ADMIN_EMAIL, role: 'ADMIN', password: passwordHash });
  customer = addUser({ id: 'cust-1', email: 'customer@example.com', role: 'CUSTOMER', password: passwordHash });
  scooper = addUser({ id: 'emp-1', email: 'scooper@example.com', role: 'EMPLOYEE', password: passwordHash });
  // An ADMIN row created through the old self-signup hole: not in ADMIN_EMAILS
  rogueAdmin = addUser({ id: 'rogue-1', email: 'attacker@example.com', role: 'ADMIN', password: passwordHash });
});

describe('anonymous access', () => {
  test('GET /admin/dashboard redirects to the admin login', async () => {
    const res = await middleware(request('/admin/dashboard'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')).pathname).toBe('/admin/login');
  });

  test('GET /api/admin/stats is 401 JSON in middleware and the handler', async () => {
    const res = await middleware(request('/api/admin/stats'));
    expect(res.status).toBe(401);
    const handlerRes = await adminVerifyRoute.GET(request('/api/admin/verify'));
    expect(handlerRes.status).toBe(401);
  });

  test('public pages and the admin login stay reachable', async () => {
    for (const path of ['/', '/pricing', '/signup', '/admin/login', '/api/admin/login', '/login']) {
      const res = await middleware(request(path));
      expect(res.headers.get('location')).toBeNull();
      expect(res.status).toBe(200);
    }
  });

  test('/admin itself is gated, and only exact path segments count as admin', async () => {
    expect((await middleware(request('/admin'))).status).toBe(307);
    expect((await middleware(request('/admin/'))).status).toBe(307);
    expect((await middleware(request('/admin/login/../dashboard'))).status).toBe(307);
    const lookalike = await middleware(request('/administrator'));
    expect(lookalike.headers.get('location')).toBeNull();
  });

  test('server-side admin layout redirects without a session', async () => {
    mockRequestScope.headers = new Headers({ 'x-admin-pathname': '/admin/dashboard' });
    await expect(AdminLayout({ children: 'secret' })).rejects.toMatchObject({
      url: '/admin/login?callbackUrl=%2Fadmin%2Fdashboard',
    });
  });

  test('admin layout still renders the login page', async () => {
    mockRequestScope.headers = new Headers({ 'x-admin-pathname': '/admin/login' });
    await expect(AdminLayout({ children: 'login form' })).resolves.toBe('login form');
  });

  test('middleware overwrites a spoofed x-admin-pathname header', async () => {
    const token = await createUserToken(admin);
    const res = await middleware(
      request('/admin/dashboard', { token, headers: { 'x-admin-pathname': '/admin/login' } })
    );
    expect(res.headers.get('x-middleware-request-x-admin-pathname')).toBe('/admin/dashboard');
  });
});

describe('non-admin roles', () => {
  test('customer session gets 403 from admin APIs', async () => {
    const token = await createUserToken(customer);
    expect((await middleware(request('/api/admin/customers', { token }))).status).toBe(403);
    expect((await adminVerifyRoute.GET(request('/api/admin/verify', { token }))).status).toBe(403);
    expect((await adminCustomersRoute.GET(request('/api/admin/customers', { token }))).status).toBe(403);
  });

  test('scooper session gets 403 from admin APIs', async () => {
    const token = await createUserToken(scooper);
    expect((await middleware(request('/api/admin/customers', { token }))).status).toBe(403);
    expect((await adminVerifyRoute.GET(request('/api/admin/verify', { token }))).status).toBe(403);
    const del = await adminCustomersRoute.DELETE(
      request('/api/admin/customers', { method: 'DELETE', token, body: { id: 'cust-1' } })
    );
    expect(del.status).toBe(403);
    expect(prisma.customer.delete).not.toHaveBeenCalled();
  });

  test('customer session is redirected away from /admin pages', async () => {
    const token = await createUserToken(customer);
    const res = await middleware(request('/admin/dashboard', { token }));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')).pathname).toBe('/admin/login');
  });
});

describe('signup', () => {
  const baseBody = {
    email: 'new-user@example.com',
    firstName: 'New',
    lastName: 'User',
    password: 'Str0ng!Passw0rd',
    deviceFingerprint: 'fp',
  };

  test.each(['ADMIN', 'admin', 'MANAGER', 'BUSINESS_PARTNER'])('role %s is rejected', async (role) => {
    const res = await signupRoute.POST(request('/api/auth/signup', { method: 'POST', body: { ...baseBody, role } }));
    expect(res.status).toBe(400);
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect([...mockDb.users.values()].some((u) => u.email === baseBody.email)).toBe(false);
  });

  test('scooper signup still works and does not echo verification tokens', async () => {
    const res = await signupRoute.POST(
      request('/api/auth/signup', { method: 'POST', body: { ...baseBody, role: 'EMPLOYEE', phone: '555' } })
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.user.role).toBe('EMPLOYEE');
    expect(json.user).not.toHaveProperty('verificationToken');
    expect(json.user).not.toHaveProperty('password');
    expect(prisma.user.create.mock.calls[0][0].data.role).toBe('EMPLOYEE');
  });
});

describe('verified admin', () => {
  test('signs in through /api/admin/login and can use admin pages and APIs', async () => {
    const loginRes = await adminLoginRoute.POST(
      request('/api/admin/login', { method: 'POST', body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })
    );
    expect(loginRes.status).toBe(200);
    const token = loginRes.cookies.get('accessToken')?.value;
    expect(token).toBeTruthy();

    const page = await middleware(request('/admin/dashboard', { token }));
    expect(page.status).toBe(200);
    expect(page.headers.get('location')).toBeNull();

    const verify = await adminVerifyRoute.GET(request('/api/admin/verify', { token }));
    expect(verify.status).toBe(200);
    expect((await verify.json()).user.email).toBe(ADMIN_EMAIL);

    const del = await adminCustomersRoute.DELETE(
      request('/api/admin/customers', { method: 'DELETE', token, body: { id: 'cust-1' } })
    );
    expect(del.status).toBe(200);
    expect(prisma.customer.delete).toHaveBeenCalledWith({ where: { id: 'cust-1' } });

    mockRequestScope.headers = new Headers({ 'x-admin-pathname': '/admin/dashboard' });
    mockRequestScope.cookies = new Map([['accessToken', token]]);
    await expect(AdminLayout({ children: 'dashboard' })).resolves.toBe('dashboard');
  });

  test('ADMIN account outside ADMIN_EMAILS cannot sign in', async () => {
    const res = await adminLoginRoute.POST(
      request('/api/admin/login', { method: 'POST', body: { email: rogueAdmin.email, password: ADMIN_PASSWORD } })
    );
    expect(res.status).toBe(401);
  });

  test('admin access fails closed when ADMIN_EMAILS is unset', async () => {
    const token = await createUserToken(admin);
    const saved = process.env.ADMIN_EMAILS;
    delete process.env.ADMIN_EMAILS;
    try {
      expect((await requireAdmin(request('/api/admin/verify', { token }))).status).toBe(403);
    } finally {
      process.env.ADMIN_EMAILS = saved;
    }
  });
});

describe('forged and stale admin sessions', () => {
  async function expectPrivilegedChangeRejected(token, status) {
    const res = await adminCustomersRoute.DELETE(
      request('/api/admin/customers', { method: 'DELETE', token, body: { id: 'cust-1' } })
    );
    expect(res.status).toBe(status);
    expect(prisma.customer.delete).not.toHaveBeenCalled();
  }

  test('token signed with the leaked early JWT secret is rejected', async () => {
    const forged = await signRaw(
      { userId: admin.id, email: admin.email, role: 'ADMIN', type: 'user', sv: 'x' },
      LEAKED_OLD_SECRET
    );
    expect((await middleware(request('/admin/dashboard', { token: forged }))).status).toBe(307);
    await expectPrivilegedChangeRejected(forged, 401);
  });

  test('pre-fix admin token (no session binding) is rejected everywhere', async () => {
    const legacy = await signRaw({ userId: admin.id, email: admin.email, role: 'ADMIN', type: 'user' });
    expect((await middleware(request('/api/admin/customers', { token: legacy }))).status).toBe(401);
    expect((await middleware(request('/admin/dashboard', { token: legacy }))).status).toBe(307);
    await expectPrivilegedChangeRejected(legacy, 401);
  });

  test('token forged with the current secret but without the password hash is rejected', async () => {
    const forged = await signRaw({
      userId: admin.id,
      email: admin.email,
      role: 'ADMIN',
      type: 'user',
      sv: 'f'.repeat(64),
    });
    await expectPrivilegedChangeRejected(forged, 401);
  });

  test('customer token with role edited to ADMIN is rejected', async () => {
    const forged = await signRaw({ userId: customer.id, email: customer.email, role: 'ADMIN', type: 'user', sv: 'x' });
    await expectPrivilegedChangeRejected(forged, 403);
  });

  test('admin created via the old signup hole is rejected even with a valid token', async () => {
    const token = await createUserToken(rogueAdmin);
    await expectPrivilegedChangeRejected(token, 403);
  });

  test('demoting an admin revokes their existing session', async () => {
    const token = await createUserToken(admin);
    mockDb.users.get(admin.id).role = 'CUSTOMER';
    await expectPrivilegedChangeRejected(token, 403);
  });

  test('changing the admin password revokes their existing session', async () => {
    const token = await createUserToken(admin);
    mockDb.users.get(admin.id).password = bcrypt.hashSync('N3w!Password', 4);
    await expectPrivilegedChangeRejected(token, 401);
  });

  test('bumping ADMIN_SESSION_EPOCH revokes all admin sessions', async () => {
    const token = await createUserToken(admin);
    process.env.ADMIN_SESSION_EPOCH = '2';
    try {
      await expectPrivilegedChangeRejected(token, 401);
    } finally {
      delete process.env.ADMIN_SESSION_EPOCH;
    }
  });
});
