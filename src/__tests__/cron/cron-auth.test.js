/**
 * @jest-environment node
 *
 * Cron route auth and scheduler wiring. No database: every request here is
 * rejected before a route touches Prisma.
 */
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

const CRON_SECRET = 'cron-auth-test-secret-0123456789abcdef';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';
process.env.STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy';
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy';

const ROOT = path.resolve(__dirname, '../../..');
const CRON_DIR = path.join(ROOT, 'src/app/api/cron');
const BASE = 'http://localhost:3000';

const cronRoutes = fs
  .readdirSync(CRON_DIR)
  .filter((name) => fs.existsSync(path.join(CRON_DIR, name, 'route.js')))
  .sort();

function request(name, { method = 'POST', headers = {}, query = '' } = {}) {
  return new NextRequest(`${BASE}/api/cron/${name}${query}`, { method, headers });
}

function handlerFor(mod) {
  return mod.POST || mod.GET;
}

describe('hasValidCronSecret', () => {
  const { hasValidCronSecret } = require('@/lib/cron-auth');
  const original = process.env.CRON_SECRET;
  afterEach(() => {
    process.env.CRON_SECRET = original;
  });

  it('accepts only the exact Bearer secret', () => {
    process.env.CRON_SECRET = CRON_SECRET;
    const req = (h) => new NextRequest(`${BASE}/x`, { headers: h });
    expect(hasValidCronSecret(req({ authorization: `Bearer ${CRON_SECRET}` }))).toBe(true);
    expect(hasValidCronSecret(req({ authorization: `bearer ${CRON_SECRET}` }))).toBe(true);
    expect(hasValidCronSecret(req({ authorization: `Bearer ${CRON_SECRET}x` }))).toBe(false);
    expect(hasValidCronSecret(req({ authorization: CRON_SECRET }))).toBe(false);
    expect(hasValidCronSecret(req({}))).toBe(false);
    expect(hasValidCronSecret(new NextRequest(`${BASE}/x?secret=${CRON_SECRET}`))).toBe(false);
  });

  it('fails closed when CRON_SECRET is unset', () => {
    delete process.env.CRON_SECRET;
    const req = new NextRequest(`${BASE}/x`, { headers: { authorization: 'Bearer ' } });
    expect(hasValidCronSecret(req)).toBe(false);
    expect(hasValidCronSecret(new NextRequest(`${BASE}/x`, { headers: { authorization: 'Bearer undefined' } }))).toBe(false);
  });
});

describe.each(cronRoutes)('/api/cron/%s auth', (name) => {
  let mod;
  beforeAll(() => {
    process.env.CRON_SECRET = CRON_SECRET;
    mod = require(`@/app/api/cron/${name}/route`);
  });

  it('rejects a request with no credentials', async () => {
    const res = await handlerFor(mod)(request(name));
    expect(res.status).toBe(401);
  });

  it('rejects the secret in the query string', async () => {
    const res = await handlerFor(mod)(request(name, { query: `?secret=${CRON_SECRET}` }));
    expect(res.status).toBe(401);
  });

  it('rejects a wrong Bearer secret', async () => {
    const res = await handlerFor(mod)(request(name, { headers: { authorization: 'Bearer not-the-secret' } }));
    expect(res.status).toBe(401);
  });

  it('rejects everything when CRON_SECRET is unset', async () => {
    delete process.env.CRON_SECRET;
    try {
      const res = await handlerFor(mod)(request(name, { headers: { authorization: 'Bearer undefined' } }));
      expect(res.status).toBe(401);
    } finally {
      process.env.CRON_SECRET = CRON_SECRET;
    }
  });
});

describe('scheduler wiring', () => {
  const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const workflow = fs.readFileSync(path.join(ROOT, '.github/workflows/cron.yml'), 'utf8');

  it('schedules the scheduling jobs in vercel.json', () => {
    const schedules = Object.fromEntries(vercel.crons.map((c) => [c.path, c.schedule]));
    expect(schedules['/api/cron/release-expired-claims']).toBe('*/5 * * * *');
    expect(schedules['/api/cron/create-weekly-services']).toBeDefined();
    expect(schedules['/api/cron/open-job-pool']).toBeDefined();
  });

  it.each(vercel.crons.map((c) => c.path))('%s exists and handles GET (Vercel Cron uses GET)', (cronPath) => {
    const name = cronPath.replace('/api/cron/', '');
    expect(cronRoutes).toContain(name);
    expect(typeof require(`@/app/api/cron/${name}/route`).GET).toBe('function');
  });

  it('keeps the GitHub workflow manual-only, with Bearer auth to existing routes', () => {
    expect(workflow).not.toMatch(/^\s*schedule:/m);
    expect(workflow).toMatch(/workflow_dispatch:/);
    expect(workflow).toContain('Authorization: Bearer ${CRON_SECRET}');
    expect(workflow).not.toMatch(/\?secret=/);
    const options = [...workflow.matchAll(/^\s+- ([a-z-]+)$/gm)].map((m) => m[1]);
    expect(options.length).toBeGreaterThan(0);
    for (const option of options) {
      expect(cronRoutes).toContain(option);
    }
  });
});
