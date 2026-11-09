/**
 * @jest-environment node
 *
 * Job claiming against a real Postgres. Needs TEST_DATABASE_URL pointing at a
 * local, disposable database whose name contains "test" (every table used
 * here is truncated). Run with: npm run test:claims
 */
import { execSync } from 'child_process';
import { NextRequest } from 'next/server';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

function assertDisposableDatabase(url) {
  const parsed = new URL(url);
  if (!['localhost', '127.0.0.1', '::1'].includes(parsed.hostname) || !/test/i.test(parsed.pathname)) {
    throw new Error(`Refusing to run destructive tests against ${parsed.hostname}${parsed.pathname}`);
  }
}

if (TEST_DATABASE_URL) {
  assertDisposableDatabase(TEST_DATABASE_URL);
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  delete process.env.DIRECT_URL;
}
process.env.JWT_SECRET = 'job-claims-test-secret';
process.env.ADMIN_EMAILS = 'owner@scoopify.club';
process.env.CRON_SECRET = 'cron-secret-for-job-claims-tests';

jest.unmock('@/lib/prisma');
jest.mock('@/lib/unified-email-service', () => ({
  sendServiceClaimedEmail: jest.fn(async () => ({ success: true })),
}));

const describeDb = TEST_DATABASE_URL ? describe : describe.skip;
if (!TEST_DATABASE_URL) {
  console.warn('Skipping job-claims DB tests: set TEST_DATABASE_URL (see npm run test:claims).');
}

const GATE_CODE = '4321#';
const STREET = '742 Evergreen Terrace';
const NOTES = 'Side gate, key under the blue pot';
const ZIP = '80831';
const BASE = 'http://localhost:3000';
const MINUTE = 60 * 1000;

describeDb('job claiming (real Postgres)', () => {
  let prisma;
  let createUserToken;
  let claims;
  let routes;
  let seq = 0;

  beforeAll(async () => {
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: 'pipe',
    });
    ({ prisma } = require('@/lib/prisma'));
    ({ createUserToken } = require('@/lib/jwt-utils'));
    claims = require('@/lib/job-claims');
    routes = {
      servicesClaim: require('@/app/api/employee/services/[id]/claim/route'),
      jobsClaim: require('@/app/api/employee/jobs/[jobId]/claim/route'),
      arrive: require('@/app/api/employee/services/[id]/arrive/route'),
      jobsCheckin: require('@/app/api/employee/jobs/[jobId]/checkin/route'),
      access: require('@/app/api/employee/services/[id]/access/route'),
      serviceDetail: require('@/app/api/services/[id]/route'),
      availableServices: require('@/app/api/employee/available-services/route'),
      jobPool: require('@/app/api/employee/jobs/pool/route'),
      employeeJobs: require('@/app/api/employee/jobs/route'),
      servicesAvailable: require('@/app/api/services/available/route'),
      jobsAvailable: require('@/app/api/jobs/available/route'),
      employeeServices: require('@/app/api/employee/services/route'),
      releaseExpired: require('@/app/api/cron/release-expired-claims/route'),
      approval: require('@/app/api/admin/employees/[employeeId]/approval/route'),
    };
  }, 120000);

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "Location", "Service", "CoverageArea", "Address", "Customer", "Employee", "User", "ServicePlan", "SystemLog", "Notification" CASCADE'
    );
  });

  const id = (prefix) => `${prefix}-${++seq}-${Math.random().toString(36).slice(2, 8)}`;

  async function createScooper({ approved = true, zip = ZIP } = {}) {
    const user = await prisma.user.create({
      data: {
        id: id('user'),
        email: `${id('scooper')}@example.com`,
        password: 'not-a-real-hash',
        role: 'EMPLOYEE',
        firstName: 'Sam',
        lastName: 'Scooper',
        updatedAt: new Date(),
      },
    });
    const employee = await prisma.employee.create({
      data: {
        id: id('emp'),
        userId: user.id,
        status: 'ACTIVE',
        hasSetServiceArea: true,
        approvedAt: approved ? new Date() : null,
        updatedAt: new Date(),
      },
    });
    await prisma.coverageArea.create({
      data: { id: id('area'), zipCode: zip, employeeId: employee.id, updatedAt: new Date() },
    });
    const token = await createUserToken({ id: user.id, email: user.email, role: 'EMPLOYEE' });
    return { user, employee, token };
  }

  async function createJob({ scheduledDate = new Date(Date.now() + 24 * 60 * MINUTE), location } = {}) {
    const customerUser = await prisma.user.create({
      data: {
        id: id('cust-user'),
        email: `${id('customer')}@example.com`,
        password: 'not-a-real-hash',
        role: 'CUSTOMER',
        firstName: 'Casey',
        lastName: 'Customer',
        updatedAt: new Date(),
      },
    });
    const customer = await prisma.customer.create({
      data: {
        id: id('cust'),
        userId: customerUser.id,
        gateCode: GATE_CODE,
        phone: '719-555-0100',
        updatedAt: new Date(),
        address: {
          create: { id: id('addr'), street: STREET, city: 'Peyton', state: 'CO', zipCode: ZIP, updatedAt: new Date() },
        },
      },
    });
    const plan = await prisma.servicePlan.create({
      data: { id: id('plan'), name: 'Weekly', price: 55, duration: 30, type: 'MONTHLY', updatedAt: new Date() },
    });
    const service = await prisma.service.create({
      data: {
        id: id('svc'),
        customerId: customer.id,
        servicePlanId: plan.id,
        scheduledDate,
        status: 'SCHEDULED',
        notes: NOTES,
        potentialEarnings: 10.31,
        updatedAt: new Date(),
        ...(location && {
          location: { create: { id: id('loc'), latitude: location.latitude, longitude: location.longitude, updatedAt: new Date() } },
        }),
      },
    });
    return { service, customer, customerUser };
  }

  async function createAdmin() {
    const user = await prisma.user.create({
      data: {
        id: id('admin'),
        email: 'owner@scoopify.club',
        password: '$2a$10$abcdefghijklmnopqrstuuJ3aCq0b8lU6a1o2m3n4o5p6q7r8s9t0',
        role: 'ADMIN',
        updatedAt: new Date(),
      },
    });
    const token = await createUserToken(user);
    return { user, token };
  }

  function req(path, { method = 'GET', token, bearer, body, headers = {} } = {}) {
    const h = new Headers(headers);
    if (token) h.set('cookie', `accessToken=${token}`);
    if (bearer) h.set('authorization', `Bearer ${bearer}`);
    if (body !== undefined) h.set('content-type', 'application/json');
    return new NextRequest(`${BASE}${path}`, {
      method,
      headers: h,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  const claimVia = (route, serviceId, scooper) =>
    route === 'jobs'
      ? routes.jobsClaim.POST(req(`/api/employee/jobs/${serviceId}/claim`, { method: 'POST', token: scooper.token }), {
          params: Promise.resolve({ jobId: serviceId }),
        })
      : routes.servicesClaim.POST(
          req(`/api/employee/services/${serviceId}/claim`, { method: 'POST', bearer: scooper.token }),
          { params: Promise.resolve({ id: serviceId }) }
        );

  const checkIn = (serviceId, scooper, body = {}) =>
    routes.arrive.POST(req(`/api/employee/services/${serviceId}/arrive`, { method: 'POST', bearer: scooper.token, body }), {
      params: Promise.resolve({ id: serviceId }),
    });

  describe('atomic claims', () => {
    test('20 concurrent claims from 2 scoopers on both endpoints: exactly one wins', async () => {
      const a = await createScooper();
      const b = await createScooper();
      const { service } = await createJob();

      const attempts = Array.from({ length: 20 }, (_, i) =>
        claimVia(i % 4 < 2 ? 'services' : 'jobs', service.id, i % 2 === 0 ? a : b)
      );
      const responses = await Promise.all(attempts);
      const statuses = responses.map((r) => r.status);

      expect(statuses.filter((s) => s === 200)).toHaveLength(1);
      expect(statuses.filter((s) => s === 409)).toHaveLength(19);

      const row = await prisma.service.findUnique({ where: { id: service.id } });
      expect([a.employee.id, b.employee.id]).toContain(row.employeeId);
      expect(row.status).toBe('PENDING');
      expect(row.workflowStatus).toBe('CLAIMED');
      expect(row.arrivalDeadline.getTime() - row.claimedAt.getTime()).toBe(45 * MINUTE);
    });

    test('a scooper racing for 5 different jobs ends up with exactly one', async () => {
      const a = await createScooper();
      const jobs = await Promise.all(Array.from({ length: 5 }, () => createJob()));

      const responses = await Promise.all(
        jobs.map(({ service }, i) => claimVia(i % 2 ? 'jobs' : 'services', service.id, a))
      );
      expect(responses.filter((r) => r.status === 200)).toHaveLength(1);
      expect(responses.filter((r) => r.status === 409)).toHaveLength(4);
      expect(await prisma.service.count({ where: { employeeId: a.employee.id } })).toBe(1);
    });

    test('second claim while a job is active returns 409 ACTIVE_JOB_EXISTS', async () => {
      const a = await createScooper();
      const first = await createJob();
      const second = await createJob();

      expect((await claimVia('services', first.service.id, a)).status).toBe(200);
      const res = await claimVia('jobs', second.service.id, a);
      expect(res.status).toBe(409);
      expect((await res.json()).code).toBe('ACTIVE_JOB_EXISTS');

      // Still blocked after check-in (IN_PROGRESS is active too)
      expect((await checkIn(first.service.id, a)).status).toBe(200);
      expect((await claimVia('services', second.service.id, a)).status).toBe(409);
    });

    test('the database rejects a second active job for one scooper on any code path', async () => {
      const a = await createScooper();
      const first = await createJob();
      const second = await createJob();
      expect((await claimVia('services', first.service.id, a)).status).toBe(200);

      await expect(
        prisma.service.update({ where: { id: second.service.id }, data: { employeeId: a.employee.id, status: 'IN_PROGRESS' } })
      ).rejects.toMatchObject({ code: 'P2002' });
    });

    test('claiming an unknown job is 404, a job outside the service area is 400', async () => {
      const a = await createScooper({ zip: '80132' });
      const { service } = await createJob();
      expect((await claimVia('services', 'missing-id', a)).status).toBe(404);
      const res = await claimVia('jobs', service.id, a);
      expect(res.status).toBe(400);
      expect((await res.json()).code).toBe('OUTSIDE_SERVICE_AREA');
    });

    test('unauthenticated and customer tokens get 401', async () => {
      const { service, customerUser } = await createJob();
      const customerToken = await createUserToken({ id: customerUser.id, email: customerUser.email, role: 'CUSTOMER' });
      expect((await claimVia('services', service.id, { token: undefined })).status).toBe(401);
      expect((await claimVia('jobs', service.id, { token: customerToken })).status).toBe(401);
    });
  });

  describe('scooper approval', () => {
    test('a pending scooper cannot list or claim jobs until an admin approves them', async () => {
      const pending = await createScooper({ approved: false });
      const { service } = await createJob();

      const claimRes = await claimVia('services', service.id, pending);
      expect(claimRes.status).toBe(403);
      expect((await claimRes.json()).code).toBe('SCOOPER_NOT_APPROVED');
      expect((await routes.jobPool.GET(req('/api/employee/jobs/pool', { token: pending.token }))).status).toBe(403);

      // Non-admin cannot approve
      const selfApprove = await routes.approval.POST(
        req(`/api/admin/employees/${pending.employee.id}/approval`, { method: 'POST', token: pending.token }),
        { params: Promise.resolve({ employeeId: pending.employee.id }) }
      );
      expect(selfApprove.status).toBe(403);

      const admin = await createAdmin();
      const approveRes = await routes.approval.POST(
        req(`/api/admin/employees/${pending.employee.id}/approval`, { method: 'POST', token: admin.token }),
        { params: Promise.resolve({ employeeId: pending.employee.id }) }
      );
      expect(approveRes.status).toBe(200);
      const approved = await prisma.employee.findUnique({ where: { id: pending.employee.id } });
      expect(approved.approvedAt).toBeInstanceOf(Date);
      expect(approved.approvedBy).toBe(admin.user.id);

      expect((await claimVia('services', service.id, pending)).status).toBe(200);

      // Revoking approval blocks further claims
      await routes.approval.DELETE(
        req(`/api/admin/employees/${pending.employee.id}/approval`, { method: 'DELETE', token: admin.token }),
        { params: Promise.resolve({ employeeId: pending.employee.id }) }
      );
      const other = await createJob();
      expect((await claimVia('jobs', other.service.id, pending)).status).toBe(403);
    });

    test('a suspended scooper cannot claim even if approved earlier', async () => {
      const a = await createScooper();
      await prisma.employee.update({ where: { id: a.employee.id }, data: { status: 'SUSPENDED' } });
      const { service } = await createJob();
      expect((await claimVia('services', service.id, a)).status).toBe(403);
    });
  });

  describe('45-minute claim expiry', () => {
    test('releaseExpiredClaims requeues only claims past the deadline without check-in', async () => {
      const a = await createScooper();
      const b = await createScooper();
      const { service } = await createJob();
      const claimedAt = new Date('2026-11-10T15:00:00Z');

      await claims.claimService({ serviceId: service.id, employeeId: a.employee.id, now: claimedAt });

      const early = await claims.releaseExpiredClaims({ now: new Date(claimedAt.getTime() + 44 * MINUTE) });
      expect(early.released).toBe(0);

      const late = await claims.releaseExpiredClaims({ now: new Date(claimedAt.getTime() + 46 * MINUTE) });
      expect(late).toEqual({ released: 1, serviceIds: [service.id] });

      const row = await prisma.service.findUnique({ where: { id: service.id } });
      expect(row).toMatchObject({ employeeId: null, status: 'SCHEDULED', workflowStatus: 'AVAILABLE', claimedAt: null, arrivalDeadline: null });
      expect(await prisma.systemLog.count({ where: { type: 'JOB_CLAIM_EXPIRED' } })).toBe(1);

      // Requeued: another scooper can claim it, the original scooper is locked out
      expect((await claimVia('jobs', service.id, b)).status).toBe(200);
      const lateCheckIn = await checkIn(service.id, a);
      expect(lateCheckIn.status).toBe(403);
      expect((await lateCheckIn.json()).code).toBe('NOT_ASSIGNED');
    });

    test('a checked-in job is never released', async () => {
      const a = await createScooper();
      const { service } = await createJob();
      expect((await claimVia('services', service.id, a)).status).toBe(200);
      expect((await checkIn(service.id, a)).status).toBe(200);

      const result = await claims.releaseExpiredClaims({ now: new Date(Date.now() + 120 * MINUTE) });
      expect(result.released).toBe(0);
      expect((await prisma.service.findUnique({ where: { id: service.id } })).employeeId).toBe(a.employee.id);
    });

    test('checking in after the deadline returns 403 and requeues the job', async () => {
      const a = await createScooper();
      const { service } = await createJob();
      expect((await claimVia('services', service.id, a)).status).toBe(200);
      await prisma.service.update({ where: { id: service.id }, data: { arrivalDeadline: new Date(Date.now() - MINUTE) } });

      const res = await checkIn(service.id, a);
      expect(res.status).toBe(403);
      expect((await res.json()).code).toBe('CLAIM_EXPIRED');
      const row = await prisma.service.findUnique({ where: { id: service.id } });
      expect(row).toMatchObject({ employeeId: null, status: 'SCHEDULED' });
    });

    test('an expired claim no longer blocks the scooper from claiming another job', async () => {
      const a = await createScooper();
      const first = await createJob();
      const second = await createJob();
      expect((await claimVia('services', first.service.id, a)).status).toBe(200);
      await prisma.service.update({ where: { id: first.service.id }, data: { arrivalDeadline: new Date(Date.now() - MINUTE) } });
      expect((await claimVia('jobs', second.service.id, a)).status).toBe(200);
    });

    test('release-expired-claims route needs the cron secret or an admin', async () => {
      const a = await createScooper();
      const { service } = await createJob();
      expect((await claimVia('services', service.id, a)).status).toBe(200);
      await prisma.service.update({ where: { id: service.id }, data: { arrivalDeadline: new Date(Date.now() - MINUTE) } });

      expect((await routes.releaseExpired.POST(req('/api/cron/release-expired-claims', { method: 'POST' }))).status).toBe(401);
      expect((await routes.releaseExpired.POST(req('/api/cron/release-expired-claims', { method: 'POST', bearer: 'wrong' }))).status).toBe(401);
      expect((await routes.releaseExpired.GET(req('/api/cron/release-expired-claims', { token: a.token }))).status).toBe(403);

      const res = await routes.releaseExpired.GET(req('/api/cron/release-expired-claims', { bearer: process.env.CRON_SECRET }));
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ success: true, released: 1, serviceIds: [service.id] });
    });

    test('overdue unclaimed jobs roll onto today on the same row', async () => {
      const now = new Date('2026-11-10T15:00:00');
      const yesterday = new Date('2026-11-09T09:30:00');
      const { service } = await createJob({ scheduledDate: yesterday });

      const result = await claims.requeueOverdueUnclaimed({ now });
      expect(result.requeued).toBe(1);
      const row = await prisma.service.findUnique({ where: { id: service.id } });
      expect(row.status).toBe('SCHEDULED');
      expect(row.scheduledDate.getTime()).toBe(new Date('2026-11-10T09:30:00').getTime());
      expect(await prisma.service.count()).toBe(1);
    });
  });

  describe('arrival check-in', () => {
    test('assigned scooper checks in once; others are refused', async () => {
      const a = await createScooper();
      const b = await createScooper();
      const { service, customerUser } = await createJob();
      expect((await claimVia('services', service.id, a)).status).toBe(200);

      expect((await checkIn(service.id, b)).status).toBe(403);
      const res = await checkIn(service.id, a);
      expect(res.status).toBe(200);
      const row = await prisma.service.findUnique({ where: { id: service.id } });
      expect(row).toMatchObject({ status: 'IN_PROGRESS', workflowStatus: 'ARRIVED' });
      expect(row.arrivedAt).toBeInstanceOf(Date);
      expect(await prisma.notification.count({ where: { userId: customerUser.id, type: 'SERVICE_STARTED' } })).toBe(1);

      const again = await routes.jobsCheckin.POST(
        req(`/api/employee/jobs/${service.id}/checkin`, { method: 'POST', token: a.token, body: {} }),
        { params: Promise.resolve({ jobId: service.id }) }
      );
      expect(again.status).toBe(409);
    });

    test('geofence: a job with a Location requires coordinates within range', async () => {
      const a = await createScooper();
      const { service } = await createJob({ location: { latitude: 39.0261, longitude: -104.4839 } });
      expect((await claimVia('services', service.id, a)).status).toBe(200);

      expect((await checkIn(service.id, a)).status).toBe(400);
      const far = await checkIn(service.id, a, { latitude: 39.1, longitude: -104.4839 });
      expect(far.status).toBe(403);
      expect((await far.json()).code).toBe('TOO_FAR');
      expect((await checkIn(service.id, a, { latitude: 39.0262, longitude: -104.4838 })).status).toBe(200);
    });
  });

  describe('gate codes and access details', () => {
    const containsSecrets = (payload) => {
      const text = JSON.stringify(payload);
      return text.includes(GATE_CODE) || text.includes(STREET) || text.includes(NOTES) || text.includes('gateCode') || text.includes('719-555-0100');
    };

    test('unclaimed-job feeds never include gate codes, street, phone or notes', async () => {
      jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'clearImmediate', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask', 'hrtime', 'performance'] });
      const noon = new Date('2026-11-10T19:00:00Z'); // 12:00 PM MST
      jest.setSystemTime(noon);
      try {
        const a = await createScooper();
        await createJob({ scheduledDate: new Date(noon.getTime() + 24 * 60 * MINUTE) });

        const feeds = [
          ['available-services', routes.availableServices.GET(req('/api/employee/available-services', { token: a.token }))],
          ['jobs/pool', routes.jobPool.GET(req('/api/employee/jobs/pool', { token: a.token }))],
          ['employee/jobs', routes.employeeJobs.GET(req('/api/employee/jobs', { bearer: a.token }))],
          ['services/available', routes.servicesAvailable.GET(req('/api/services/available', { token: a.token }))],
          ['jobs/available', routes.jobsAvailable.GET(req('/api/jobs/available', { token: a.token }))],
          ['employee/services', routes.employeeServices.GET(req('/api/employee/services', { token: a.token }))],
        ];
        for (const [name, pending] of feeds) {
          const res = await pending;
          const body = await res.json();
          expect({ name, status: res.status }).toEqual({ name, status: 200 });
          expect(JSON.stringify(body)).toContain(ZIP);
          expect({ name, leaks: containsSecrets(body) }).toEqual({ name, leaks: false });
        }
      } finally {
        jest.useRealTimers();
      }
    });

    test('available-services is closed outside 8 AM-7 PM America/Denver regardless of server time', async () => {
      jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'clearImmediate', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask', 'hrtime', 'performance'] });
      try {
        const a = await createScooper();
        // 14:00 UTC is 7:00 AM MST: open in UTC, closed in Denver
        jest.setSystemTime(new Date('2026-11-10T14:00:00Z'));
        const early = await routes.availableServices.GET(req('/api/employee/available-services', { token: a.token }));
        expect(early.status).toBe(400);
        expect((await early.json()).unlockTime).toBe('2026-11-10T15:00:00.000Z');
        // 01:30 UTC next day is 6:30 PM MST: closed in UTC, open in Denver
        jest.setSystemTime(new Date('2026-11-11T01:30:00Z'));
        const token = await createUserToken({ id: a.user.id, email: a.user.email, role: 'EMPLOYEE' });
        expect((await routes.availableServices.GET(req('/api/employee/available-services', { token }))).status).toBe(200);
      } finally {
        jest.useRealTimers();
      }
    });

    test('only the assigned scooper sees the gate code after claiming, and reveals are logged', async () => {
      const a = await createScooper();
      const b = await createScooper();
      const { service } = await createJob();

      const accessFor = (scooper) =>
        routes.access.GET(req(`/api/employee/services/${service.id}/access`, { token: scooper?.token }), {
          params: Promise.resolve({ id: service.id }),
        });

      expect((await accessFor(a)).status).toBe(403);

      const claimRes = await claimVia('services', service.id, a);
      const claimBody = await claimRes.json();
      expect(claimBody.service.gateCode).toBe(GATE_CODE);

      const access = await accessFor(a);
      expect(access.status).toBe(200);
      expect(await access.json()).toMatchObject({ gateCode: GATE_CODE, notes: NOTES, address: { street: STREET } });
      expect((await accessFor(b)).status).toBe(403);
      expect((await accessFor(undefined)).status).toBe(401);

      const detailFor = (scooper) =>
        routes.serviceDetail.GET(req(`/api/services/${service.id}`, { bearer: scooper.token }), {
          params: Promise.resolve({ id: service.id }),
        });
      const detail = await detailFor(a);
      expect(detail.status).toBe(200);
      const detailBody = await detail.json();
      expect(detailBody.customer.gateCode).toBe(GATE_CODE);
      expect(JSON.stringify(detailBody)).not.toContain('not-a-real-hash');
      expect((await detailFor(b)).status).toBe(403);

      expect(await prisma.systemLog.count({ where: { type: 'GATE_CODE_REVEALED' } })).toBeGreaterThanOrEqual(3);

      // Once the claim expires the gate code is no longer available to the old assignee
      await prisma.service.update({ where: { id: service.id }, data: { arrivalDeadline: new Date(Date.now() - MINUTE) } });
      expect((await accessFor(a)).status).toBe(403);
    });
  });
});
