/**
 * @jest-environment node
 */
import {
  redactText,
  sanitize,
  sanitizePath,
  REDACTED,
  OMITTED,
} from '../lib/log-redaction.js';
import {
  buildErrorEntry,
  logServerError,
  logServerEvent,
  pruneSystemLogs,
  __setPrismaForTests,
  __resetServerLogStateForTests,
} from '../lib/server-log.js';
import { onRequestError } from '../instrumentation.js';

const SECRETS = [
  'hunter2-Password!',
  'sk_live_51HqFakeSecretKey0000',
  'whsec_FakeWebhookSecret123456',
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.c2lnbmF0dXJlLXZhbHVl',
  '4242424242424242',
  'neon-db-password',
  'gate-7319',
  'refresh-abcdef123456',
];

function expectNoSecrets(value) {
  const text = JSON.stringify(value);
  for (const secret of SECRETS) expect(text).not.toContain(secret);
}

function fakePrisma(overrides = {}) {
  return {
    systemLog: {
      create: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      ...overrides,
    },
  };
}

const ENV_KEYS = [
  'SERVER_LOG_DB',
  'SERVER_LOG_TIMEOUT_MS',
  'SERVER_LOG_MAX_PER_MINUTE',
  'SYSTEM_LOG_RETENTION_DAYS',
  'SERVER_LOG_PRUNE_INTERVAL_HOURS',
  'NEXT_RUNTIME',
];
const savedEnv = {};

beforeEach(() => {
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
  for (const key of ENV_KEYS) delete process.env[key];
  process.env.NEXT_RUNTIME = 'nodejs';
  __resetServerLogStateForTests();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
  __setPrismaForTests(undefined);
  jest.restoreAllMocks();
});

describe('redactText', () => {
  test('redacts key/value secrets in Prisma-style and JSON-style text', () => {
    const out = redactText(
      'Invalid `prisma.user.create()` invocation: { data: { email: "a@b.co", password: "hunter2-Password!", gateCode: "gate-7319" } } {"refreshToken":"refresh-abcdef123456"} api_key=abc123',
    );
    expect(out).not.toContain('hunter2-Password!');
    expect(out).not.toContain('gate-7319');
    expect(out).not.toContain('refresh-abcdef123456');
    expect(out).not.toContain('abc123');
    expect(out).toContain(`password: ${REDACTED}`);
    expect(out).toContain('a@b.co');
  });

  test('redacts bearer tokens, JWTs, Stripe keys and connection strings', () => {
    const out = redactText(
      'Authorization: Bearer abcdefghijklmnop token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.c2lnbmF0dXJlLXZhbHVl key sk_live_51HqFakeSecretKey0000 whsec_FakeWebhookSecret123456 at postgresql://scoop:neon-db-password@ep-x.neon.tech/db?sslmode=require',
    );
    expectNoSecrets(out);
    expect(out).not.toContain('abcdefghijklmnop');
    expect(out).toContain('postgresql://[REDACTED]');
  });

  test('redacts Luhn-valid card numbers but keeps ordinary numbers', () => {
    const out = redactText('card 4242 4242 4242 4242 and 4000-0566-5566-5556, order 1794265871258, zip 80202');
    expect(out).not.toMatch(/4242 4242/);
    expect(out).not.toContain('4000-0566');
    expect(out).toContain('1794265871258');
    expect(out).toContain('80202');
  });

  test('truncates very long text', () => {
    const out = redactText('x'.repeat(5000), 100);
    expect(out.length).toBeLessThan(150);
    expect(out).toContain('truncated');
  });
});

describe('sanitize', () => {
  test('redacts sensitive keys, omits bodies, keeps useful context', () => {
    const input = {
      userId: 'user_123',
      password: 'hunter2-Password!',
      newPassword: 'hunter2-Password!',
      accessToken: 'refresh-abcdef123456',
      gateCode: 'gate-7319',
      cardNumber: '4242424242424242',
      cvc: '123',
      headers: { authorization: 'Bearer x', cookie: 'token=abc', 'user-agent': 'curl' },
      body: { anything: 'at all' },
      nested: { deeper: { stripeSecret: 'sk_live_51HqFakeSecretKey0000', note: 'ok' } },
    };
    const out = sanitize(input);
    expectNoSecrets(out);
    expect(out.userId).toBe('user_123');
    expect(out.password).toBe(REDACTED);
    expect(out.gateCode).toBe(REDACTED);
    expect(out.cardNumber).toBe(REDACTED);
    expect(out.body).toBe(OMITTED);
    expect(out.headers.authorization).toBe(REDACTED);
    expect(out.headers.cookie).toBe(REDACTED);
    expect(out.nested.deeper.note).toBe('ok');
  });

  test('handles circular references, deep nesting and long arrays', () => {
    const a = { name: 'a' };
    a.self = a;
    const deep = { l1: { l2: { l3: { l4: { l5: 'too deep' } } } } };
    const out = sanitize({ a, deep, list: Array.from({ length: 50 }, (_, i) => i) });
    expect(out.a.self).toBe('[Circular]');
    expect(JSON.stringify(out.deep)).toContain('[MaxDepth]');
    expect(out.list).toHaveLength(21);
  });
});

describe('sanitizePath', () => {
  test('drops query strings and masks token-like segments', () => {
    expect(sanitizePath('/reset-password?token=refresh-abcdef123456')).toBe('/reset-password');
    expect(sanitizePath('https://www.scoopify.club/api/x?a=1#frag')).toBe('/api/x');
    expect(sanitizePath('/verify/abcdefghijklmnopqrstuvwxyz0123456789')).toBe('/verify/:redacted');
    expect(sanitizePath('/api/services/0b3a9e7c-1d2f-4c5b-9a8e-7f6d5c4b3a21')).toBe(
      '/api/services/0b3a9e7c-1d2f-4c5b-9a8e-7f6d5c4b3a21',
    );
  });
});

describe('buildErrorEntry', () => {
  const request = {
    path: '/api/auth/login?email=a@b.co&password=hunter2-Password!',
    method: 'post',
    headers: {
      'x-vercel-id': 'iad1::abcde-1794265871257-0e38bdbbde7d',
      cookie: 'accessToken=refresh-abcdef123456',
      authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.c2lnbmF0dXJlLXZhbHVl',
    },
    body: '{"password":"hunter2-Password!","cardNumber":"4242424242424242"}',
  };
  const context = { routerKind: 'App Router', routePath: '/api/auth/login', routeType: 'route' };

  test('captures route, method, status, message, stack, request id and timestamp', () => {
    const error = new Error('Login failed for password: "hunter2-Password!"');
    const entry = buildErrorEntry(error, { request, context });
    expect(entry.type).toBe('SERVER_ERROR');
    expect(entry.message).toContain('Login failed');
    expect(entry.data).toMatchObject({
      route: '/api/auth/login',
      path: '/api/auth/login',
      method: 'POST',
      status: 500,
      requestId: 'iad1::abcde-1794265871257-0e38bdbbde7d',
      routeType: 'route',
    });
    expect(entry.data.stack).toContain('Error: Login failed');
    expect(new Date(entry.data.timestamp).toString()).not.toBe('Invalid Date');
  });

  test('never includes headers, cookies, bodies or secrets', () => {
    const error = new Error('boom with sk_live_51HqFakeSecretKey0000');
    const entry = buildErrorEntry(error, { request, context });
    expectNoSecrets(entry);
    const text = JSON.stringify(entry);
    expect(text).not.toContain('cookie');
    expect(text).not.toContain('authorization');
    expect(text).not.toContain('email=');
  });

  test('reads Headers instances, error status codes, and generates a request id when missing', () => {
    const err = Object.assign(new Error('nope'), { statusCode: 503 });
    const entry = buildErrorEntry(err, {
      request: { url: '/x', method: 'GET', headers: new Headers({ 'x-request-id': 'req-42' }) },
    });
    expect(entry.data.status).toBe(503);
    expect(entry.data.requestId).toBe('req-42');

    const generated = buildErrorEntry('string thrown', {});
    expect(generated.data.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(generated.message).toBe('string thrown');
  });

  test('sanitizes caller-supplied extra context', () => {
    const entry = buildErrorEntry(new Error('x'), {
      extra: { customerId: 'c1', gateCode: 'gate-7319', body: { password: 'hunter2-Password!' } },
    });
    expectNoSecrets(entry);
    expect(entry.data.extra.customerId).toBe('c1');
  });
});

describe('logServerError fail-open behaviour', () => {
  test('writes a sanitized row on success', async () => {
    const prisma = fakePrisma();
    __setPrismaForTests(prisma);
    const ok = await logServerError(new Error('password=hunter2-Password!'), {
      request: { path: '/api/a', method: 'GET', headers: {} },
    });
    expect(ok).toBe(true);
    const row = prisma.systemLog.create.mock.calls[0][0].data;
    expect(row.type).toBe('SERVER_ERROR');
    expectNoSecrets(row);
  });

  test('resolves false (never throws) when the database rejects', async () => {
    __setPrismaForTests(fakePrisma({ create: jest.fn().mockRejectedValue(new Error('P1001 db down')) }));
    await expect(logServerError(new Error('x'))).resolves.toBe(false);
  });

  test('resolves false when the client throws synchronously or is missing', async () => {
    __setPrismaForTests(
      fakePrisma({
        create: jest.fn(() => {
          throw new Error('sync');
        }),
      }),
    );
    await expect(logServerError(new Error('x'))).resolves.toBe(false);

    __resetServerLogStateForTests();
    __setPrismaForTests(null);
    await expect(logServerError(new Error('x'))).resolves.toBe(false);
  });

  test('gives up after SERVER_LOG_TIMEOUT_MS when the database hangs', async () => {
    process.env.SERVER_LOG_TIMEOUT_MS = '100';
    __setPrismaForTests(fakePrisma({ create: jest.fn(() => new Promise(() => {})) }));
    const started = Date.now();
    await expect(logServerError(new Error('x'))).resolves.toBe(false);
    expect(Date.now() - started).toBeLessThan(1000);
  });

  test('skips writes during the cooldown after a failure', async () => {
    const create = jest.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValue({});
    __setPrismaForTests(fakePrisma({ create }));
    expect(await logServerError(new Error('first'))).toBe(false);
    expect(await logServerError(new Error('second'))).toBe(false);
    expect(create).toHaveBeenCalledTimes(1);
  });

  test('caps writes per minute and reports how many were dropped', async () => {
    process.env.SERVER_LOG_MAX_PER_MINUTE = '2';
    const prisma = fakePrisma();
    __setPrismaForTests(prisma);
    expect(await logServerError(new Error('1'))).toBe(true);
    expect(await logServerError(new Error('2'))).toBe(true);
    expect(await logServerError(new Error('3'))).toBe(false);
    expect(prisma.systemLog.create).toHaveBeenCalledTimes(2);
  });

  test('SERVER_LOG_DB=off disables writes', async () => {
    process.env.SERVER_LOG_DB = 'off';
    const prisma = fakePrisma();
    __setPrismaForTests(prisma);
    expect(await logServerError(new Error('x'))).toBe(false);
    expect(prisma.systemLog.create).not.toHaveBeenCalled();
  });

  test('logServerEvent redacts message and extra', async () => {
    const prisma = fakePrisma();
    __setPrismaForTests(prisma);
    await logServerEvent('warn', 'retrying with token=refresh-abcdef123456', { gateCode: 'gate-7319' });
    const row = prisma.systemLog.create.mock.calls[0][0].data;
    expect(row.type).toBe('SERVER_WARN');
    expectNoSecrets(row);
  });
});

describe('onRequestError (instrumentation)', () => {
  test('logs uncaught errors through the helper', async () => {
    const prisma = fakePrisma();
    __setPrismaForTests(prisma);
    await onRequestError(new Error('render failed'), { path: '/dashboard', method: 'GET', headers: {} }, {
      routerKind: 'App Router',
      routePath: '/dashboard',
      routeType: 'render',
    });
    expect(prisma.systemLog.create).toHaveBeenCalledTimes(1);
    expect(prisma.systemLog.create.mock.calls[0][0].data.data.route).toBe('/dashboard');
  });

  test('never throws, even with a broken database or malformed arguments', async () => {
    __setPrismaForTests(fakePrisma({ create: jest.fn().mockRejectedValue(new Error('down')) }));
    await expect(onRequestError(new Error('x'), { path: '/a', method: 'GET', headers: {} }, {})).resolves.toBeUndefined();
    await expect(onRequestError(undefined, undefined, undefined)).resolves.toBeUndefined();
  });

  test('does nothing in the edge runtime', async () => {
    process.env.NEXT_RUNTIME = 'edge';
    const prisma = fakePrisma();
    __setPrismaForTests(prisma);
    await onRequestError(new Error('x'), { path: '/a', method: 'GET', headers: {} }, {});
    expect(prisma.systemLog.create).not.toHaveBeenCalled();
  });
});

describe('retention', () => {
  test('prunes only SERVER_* rows older than the default 30 days', async () => {
    const prisma = fakePrisma({ deleteMany: jest.fn().mockResolvedValue({ count: 7 }) });
    __setPrismaForTests(prisma);
    const before = Date.now();
    expect(await pruneSystemLogs()).toBe(7);
    const { where } = prisma.systemLog.deleteMany.mock.calls[0][0];
    expect(where.type).toEqual({ startsWith: 'SERVER_' });
    const ageDays = (before - where.createdAt.lt.getTime()) / 86_400_000;
    expect(ageDays).toBeCloseTo(30, 2);
  });

  test('honours SYSTEM_LOG_RETENTION_DAYS and fails open', async () => {
    process.env.SYSTEM_LOG_RETENTION_DAYS = '7';
    const prisma = fakePrisma();
    __setPrismaForTests(prisma);
    await pruneSystemLogs();
    const cutoff = prisma.systemLog.deleteMany.mock.calls[0][0].where.createdAt.lt.getTime();
    expect((Date.now() - cutoff) / 86_400_000).toBeCloseTo(7, 2);

    __setPrismaForTests(fakePrisma({ deleteMany: jest.fn().mockRejectedValue(new Error('down')) }));
    await expect(pruneSystemLogs()).resolves.toBeNull();
  });

  test('a successful write triggers at most one prune per interval', async () => {
    const prisma = fakePrisma();
    __setPrismaForTests(prisma);
    await logServerError(new Error('1'));
    await logServerError(new Error('2'));
    await new Promise((resolve) => setImmediate(resolve));
    expect(prisma.systemLog.deleteMany).toHaveBeenCalledTimes(1);
  });
});
