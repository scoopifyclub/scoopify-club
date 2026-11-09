/**
 * @jest-environment node
 */
import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { NextRequest } from 'next/server';

const ADMIN_EMAIL = 'owner@scoopify.club';
const OLD_PASSWORD = 'Old!Passw0rd#42';
const NEW_PASSWORD = 'Fresh!Passw0rd#97';

process.env.JWT_SECRET = 'password-reset-test-secret';
process.env.ADMIN_EMAILS = ADMIN_EMAIL;
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

const mockDb = { users: new Map(), refreshTokens: [], failNextFindMany: false };

jest.mock('@/lib/prisma', () => {
  const pick = (row, select) => {
    if (!row) return null;
    if (!select) return { ...row };
    return Object.fromEntries(Object.keys(select).filter((k) => select[k]).map((k) => [k, row[k]]));
  };
  const gtOk = (value, cond) => !cond?.gt || (value instanceof Date && value > cond.gt);
  const matches = (row, where = {}) =>
    (where.id === undefined || row.id === where.id) &&
    (where.resetToken === undefined || row.resetToken === where.resetToken) &&
    gtOk(row.resetTokenExpiry, where.resetTokenExpiry);
  const users = () => [...mockDb.users.values()];
  const prisma = {
    user: {
      findUnique: jest.fn(async ({ where, select }) => {
        const row = where.id ? mockDb.users.get(where.id) : users().find((u) => u.email === where.email);
        return pick(row, select);
      }),
      findMany: jest.fn(async ({ where, select, take }) => {
        if (mockDb.failNextFindMany) {
          mockDb.failNextFindMany = false;
          throw new Error('connection refused');
        }
        const wanted = where.email.equals.toLowerCase();
        return users().filter((u) => u.email.toLowerCase() === wanted).slice(0, take).map((u) => pick(u, select));
      }),
      findFirst: jest.fn(async ({ where, select }) => pick(users().find((u) => matches(u, where)), select)),
      update: jest.fn(async ({ where, data }) => {
        const row = mockDb.users.get(where.id);
        Object.assign(row, data);
        return { ...row };
      }),
      updateMany: jest.fn(async ({ where, data }) => {
        const rows = users().filter((u) => matches(u, where));
        rows.forEach((row) => Object.assign(row, data));
        return { count: rows.length };
      }),
    },
    refreshToken: {
      deleteMany: jest.fn(async ({ where }) => {
        const before = mockDb.refreshTokens.length;
        mockDb.refreshTokens = mockDb.refreshTokens.filter((t) => t.userId !== where.userId);
        return { count: before - mockDb.refreshTokens.length };
      }),
    },
    customer: {
      findFirst: jest.fn(async ({ where }) => ({ id: `cust-${where.userId}`, userId: where.userId })),
    },
    $transaction: jest.fn(async (fn) => fn(prisma)),
  };
  return { __esModule: true, prisma, default: prisma, withDatabase: (fn) => fn(prisma) };
});

const mockEmails = [];
jest.mock('@/lib/email-service', () => ({
  sendPasswordResetEmail: jest.fn(async (to, userName, resetToken) => {
    mockEmails.push({ to, userName, resetToken });
    return { success: true };
  }),
}));

const mockRequestScope = { cookies: new Map() };
jest.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name) => (mockRequestScope.cookies.has(name) ? { name, value: mockRequestScope.cookies.get(name) } : undefined),
    getAll: () => [...mockRequestScope.cookies].map(([name, value]) => ({ name, value })),
    set: jest.fn(),
  }),
}));

const { createUserToken, createRefreshToken } = require('@/lib/jwt-utils');
const { validateUser, generateTokens } = require('@/lib/api-auth');
const { requireAdmin } = require('@/lib/admin-auth');
const { hashPassword } = require('@/lib/auth/password');
const { hashResetToken, RESET_TOKEN_TTL_MS, GENERIC_REQUEST_MESSAGE } = require('@/lib/password-reset');
const forgotPasswordRoute = require('@/app/api/auth/forgot-password/route');
const requestRoute = require('@/app/api/auth/reset-password/request/route');
const resetPasswordRoute = require('@/app/api/auth/reset-password/route');
const resetRoute = require('@/app/api/auth/reset-password/reset/route');
const meRoute = require('@/app/api/auth/me/route');

let ipCounter = 0;
function freshIp() {
  ipCounter += 1;
  return `203.0.113.${ipCounter % 250}.${ipCounter}`;
}

function jsonRequest(path, method, body, ip = freshIp()) {
  return new NextRequest(`http://localhost:3000${path}`, {
    method,
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const forgot = (email, ip) => forgotPasswordRoute.POST(jsonRequest('/api/auth/forgot-password', 'POST', { email }, ip));
const resetPut = (token, newPassword, ip) =>
  resetPasswordRoute.PUT(jsonRequest('/api/auth/reset-password', 'PUT', { token, newPassword }, ip));
const checkToken = (token) =>
  resetPasswordRoute.GET(jsonRequest(`/api/auth/reset-password?token=${encodeURIComponent(token)}`, 'GET'));

async function addUser(id, email, role) {
  const user = {
    id,
    email,
    role,
    firstName: 'Pat',
    password: await bcrypt.hash(OLD_PASSWORD, 4),
    resetToken: null,
    resetTokenExpiry: null,
  };
  mockDb.users.set(id, user);
  return user;
}

async function issueResetToken(email) {
  const before = mockEmails.length;
  const res = await forgot(email);
  expect(res.status).toBe(200);
  expect(mockEmails.length).toBe(before + 1);
  return mockEmails[mockEmails.length - 1].resetToken;
}

let customer;
let scooper;
let admin;

beforeEach(async () => {
  mockDb.users.clear();
  mockDb.refreshTokens = [];
  mockEmails.length = 0;
  mockRequestScope.cookies.clear();
  customer = await addUser('user-customer', 'customer@example.com', 'CUSTOMER');
  scooper = await addUser('user-scooper', 'scooper@example.com', 'EMPLOYEE');
  admin = await addUser('user-admin', ADMIN_EMAIL, 'ADMIN');
});

describe('requesting a reset', () => {
  test('unknown and known emails get the same status and body', async () => {
    const unknown = await forgot('nobody@example.com');
    const known = await forgot(customer.email);
    expect(unknown.status).toBe(200);
    expect(known.status).toBe(200);
    const unknownBody = await unknown.json();
    expect(await known.json()).toEqual(unknownBody);
    expect(unknownBody).toEqual({ success: true, message: GENERIC_REQUEST_MESSAGE });
  });

  test('a database error still gets the generic response', async () => {
    mockDb.failNextFindMany = true;
    const res = await forgot(customer.email);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, message: GENERIC_REQUEST_MESSAGE });
  });

  test('all request endpoints return the same generic response', async () => {
    for (const route of [requestRoute, resetPasswordRoute]) {
      for (const email of [customer.email, 'nobody@example.com']) {
        mockDb.users.get(customer.id).resetTokenExpiry = null;
        const res = await route.POST(jsonRequest('/api/auth/reset-password', 'POST', { email }));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ success: true, message: GENERIC_REQUEST_MESSAGE });
      }
    }
  });

  test('only a SHA-256 digest of a random token is stored, expiring in one hour', async () => {
    const issuedAt = Date.now();
    const token = await issueResetToken(customer.email);
    const row = mockDb.users.get(customer.id);

    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(token).not.toContain(customer.id);
    expect(row.resetToken).toBe(createHash('sha256').update(token).digest('hex'));
    expect(row.resetToken).not.toBe(token);
    const ttl = row.resetTokenExpiry.getTime() - issuedAt;
    expect(ttl).toBeGreaterThan(RESET_TOKEN_TTL_MS - 5000);
    expect(ttl).toBeLessThanOrEqual(RESET_TOKEN_TTL_MS + 1000);
  });

  test('email lookup ignores case and surrounding whitespace', async () => {
    await forgot('  Customer@Example.COM ');
    expect(mockEmails).toHaveLength(1);
    expect(mockEmails[0].to).toBe(customer.email);
  });

  test('a second request within a minute sends no new email and keeps the first link', async () => {
    const first = await issueResetToken(customer.email);
    const res = await forgot(customer.email);
    expect(await res.json()).toEqual({ success: true, message: GENERIC_REQUEST_MESSAGE });
    expect(mockEmails).toHaveLength(1);
    expect(mockDb.users.get(customer.id).resetToken).toBe(hashResetToken(first));
  });

  test('a new request after the resend interval replaces the previous link', async () => {
    const first = await issueResetToken(customer.email);
    mockDb.users.get(customer.id).resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_TTL_MS - 2 * 60 * 1000);
    const second = await issueResetToken(customer.email);
    expect(second).not.toBe(first);
    expect((await resetPut(first, NEW_PASSWORD)).status).toBe(400);
    expect((await resetPut(second, NEW_PASSWORD)).status).toBe(200);
  });

  test('the user name is HTML-escaped in the email', async () => {
    mockDb.users.get(customer.id).firstName = '<img src=x onerror=alert(1)>';
    await forgot(customer.email);
    expect(mockEmails[0].userName).toBe('&lt;img src=x onerror=alert(1)&gt;');
  });

  test('missing email is a 400 that does not depend on any account', async () => {
    const res = await forgotPasswordRoute.POST(jsonRequest('/api/auth/forgot-password', 'POST', {}));
    expect(res.status).toBe(400);
  });

  test('requests are rate limited per IP', async () => {
    const ip = '198.51.100.77';
    const statuses = [];
    for (let i = 0; i < 6; i++) {
      statuses.push((await forgot(`someone${i}@example.com`, ip)).status);
    }
    expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(statuses[5]).toBe(429);
  });
});

describe('checking a token', () => {
  test('a valid token reports only validity, not whose account it is', async () => {
    const token = await issueResetToken(customer.email);
    const res = await checkToken(token);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ valid: true });
  });

  test('unknown, malformed and stored-digest tokens are invalid', async () => {
    const token = await issueResetToken(customer.email);
    for (const candidate of ['f'.repeat(64), 'reset_user-customer_1', hashResetToken(token)]) {
      const res = await checkToken(candidate);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.valid).toBe(false);
      expect(JSON.stringify(body)).not.toContain(customer.email);
    }
  });
});

describe('resetting the password', () => {
  test('stores a bcrypt hash, consumes the token and returns no account data', async () => {
    const token = await issueResetToken(customer.email);
    const res = await resetPut(token, NEW_PASSWORD);
    expect(res.status).toBe(200);

    const row = mockDb.users.get(customer.id);
    expect(row.password.startsWith('$2')).toBe(true);
    expect(row.password).not.toBe(NEW_PASSWORD);
    expect(await bcrypt.compare(NEW_PASSWORD, row.password)).toBe(true);
    expect(row.resetToken).toBeNull();
    expect(row.resetTokenExpiry).toBeNull();

    const text = JSON.stringify(await res.json());
    expect(text).not.toContain(customer.email);
    expect(text).not.toContain(customer.id);
    expect(text).not.toContain(token);
  });

  test('the UI endpoint (POST /reset-password/reset) behaves the same', async () => {
    const token = await issueResetToken(scooper.email);
    const res = await resetRoute.POST(
      jsonRequest('/api/auth/reset-password/reset', 'POST', { token, password: NEW_PASSWORD })
    );
    expect(res.status).toBe(200);
    expect(await bcrypt.compare(NEW_PASSWORD, mockDb.users.get(scooper.id).password)).toBe(true);
  });

  test('a token works only once', async () => {
    const token = await issueResetToken(customer.email);
    expect((await resetPut(token, NEW_PASSWORD)).status).toBe(200);
    const again = await resetPut(token, 'Another!Passw0rd#55');
    expect(again.status).toBe(400);
    expect(await bcrypt.compare(NEW_PASSWORD, mockDb.users.get(customer.id).password)).toBe(true);
  });

  test('concurrent submissions of one token succeed exactly once', async () => {
    const token = await issueResetToken(customer.email);
    const results = await Promise.all([
      resetPut(token, NEW_PASSWORD),
      resetPut(token, 'Another!Passw0rd#55'),
      resetPut(token, 'Third!Passw0rd#66x'),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 400, 400]);
  });

  test('an expired token is rejected and the password is unchanged', async () => {
    const token = await issueResetToken(customer.email);
    mockDb.users.get(customer.id).resetTokenExpiry = new Date(Date.now() - 1000);
    const res = await resetPut(token, NEW_PASSWORD);
    expect(res.status).toBe(400);
    expect(await bcrypt.compare(OLD_PASSWORD, mockDb.users.get(customer.id).password)).toBe(true);
  });

  test('the stored digest cannot be used as a token', async () => {
    const token = await issueResetToken(customer.email);
    const res = await resetPut(hashResetToken(token), NEW_PASSWORD);
    expect(res.status).toBe(400);
    expect(await bcrypt.compare(OLD_PASSWORD, mockDb.users.get(customer.id).password)).toBe(true);
  });

  test('a legacy predictable token is rejected', async () => {
    const legacy = `reset_${customer.id}_${Date.now()}`;
    Object.assign(mockDb.users.get(customer.id), {
      resetToken: legacy,
      resetTokenExpiry: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });
    expect((await resetPut(legacy, NEW_PASSWORD)).status).toBe(400);
  });

  test('a weak password is rejected without consuming the token', async () => {
    const token = await issueResetToken(customer.email);
    const weak = await resetPut(token, 'short');
    expect(weak.status).toBe(400);
    expect((await weak.json()).details.length).toBeGreaterThan(0);
    expect(mockDb.users.get(customer.id).resetToken).toBe(hashResetToken(token));
    expect((await resetPut(token, NEW_PASSWORD)).status).toBe(200);
  });

  test('invalid-token and missing-field errors do not reveal accounts', async () => {
    const bad = await resetPut('a'.repeat(64), NEW_PASSWORD);
    expect(bad.status).toBe(400);
    const missing = await resetPut('', '');
    expect(missing.status).toBe(400);
    for (const res of [bad, missing]) {
      expect(JSON.stringify(await res.json())).not.toMatch(/@example\.com|user-customer/);
    }
  });

  test('the success response clears auth cookies', async () => {
    const token = await issueResetToken(customer.email);
    const res = await resetPut(token, NEW_PASSWORD);
    const cookies = res.headers.getSetCookie().join('\n');
    for (const name of ['accessToken', 'refreshToken', 'token']) {
      expect(cookies).toMatch(new RegExp(`${name}=;.*(Max-Age=0|Expires=Thu, 01 Jan 1970)`));
    }
  });

  test('hashPassword in lib/auth/password returns a bcrypt hash', async () => {
    const hashed = await hashPassword(NEW_PASSWORD);
    expect(hashed.startsWith('$2')).toBe(true);
    expect(await bcrypt.compare(NEW_PASSWORD, hashed)).toBe(true);
  });
});

describe('sessions after a reset', () => {
  test('a customer session issued before the reset is revoked, a new login works', async () => {
    const before = await createUserToken(customer);
    expect(await validateUser(before)).toMatchObject({ userId: customer.id, role: 'CUSTOMER' });

    const token = await issueResetToken(customer.email);
    expect((await resetPut(token, NEW_PASSWORD)).status).toBe(200);

    expect(await validateUser(before)).toBeNull();
    const { accessToken } = await generateTokens(mockDb.users.get(customer.id));
    expect(await validateUser(accessToken)).toMatchObject({ userId: customer.id, customerId: `cust-${customer.id}` });
  });

  test('a scooper session issued before the reset is rejected by /api/auth/me', async () => {
    const before = await createUserToken(scooper);
    mockRequestScope.cookies.set('accessToken', before);
    const meRequest = () => new NextRequest('http://localhost:3000/api/auth/me');
    expect((await meRoute.GET(meRequest())).status).toBe(200);

    const token = await issueResetToken(scooper.email);
    expect((await resetPut(token, NEW_PASSWORD)).status).toBe(200);

    expect((await meRoute.GET(meRequest())).status).toBe(401);
    expect(await validateUser(before)).toBeNull();
  });

  test('an admin session issued before the reset is revoked', async () => {
    const before = await createUserToken(admin);
    const adminRequest = (t) =>
      new NextRequest('http://localhost:3000/api/admin/stats', { headers: { authorization: `Bearer ${t}` } });
    expect((await requireAdmin(adminRequest(before))).ok).toBe(true);

    const token = await issueResetToken(admin.email);
    expect((await resetPut(token, NEW_PASSWORD)).status).toBe(200);

    const after = await requireAdmin(adminRequest(before));
    expect(after.ok).toBe(false);
    expect(after.status).toBe(401);
    const fresh = await createUserToken(mockDb.users.get(admin.id));
    expect((await requireAdmin(adminRequest(fresh))).ok).toBe(true);
  });

  test('stored refresh tokens for that user are deleted, other users keep theirs', async () => {
    mockDb.refreshTokens.push(
      { userId: customer.id, token: await createRefreshToken(customer) },
      { userId: customer.id, token: 'second-device' },
      { userId: scooper.id, token: await createRefreshToken(scooper) }
    );
    const token = await issueResetToken(customer.email);
    expect((await resetPut(token, NEW_PASSWORD)).status).toBe(200);
    expect(mockDb.refreshTokens.map((t) => t.userId)).toEqual([scooper.id]);
  });

  test('another user\'s session is unaffected by a reset', async () => {
    const scooperSession = await createUserToken(scooper);
    const token = await issueResetToken(customer.email);
    expect((await resetPut(token, NEW_PASSWORD)).status).toBe(200);
    expect(await validateUser(scooperSession)).toMatchObject({ userId: scooper.id });
  });

  test('a session token without a password-bound version is rejected', async () => {
    const unbound = await createUserToken({ id: customer.id, email: customer.email, role: 'CUSTOMER' });
    expect(await validateUser(unbound)).toBeNull();
  });
});
