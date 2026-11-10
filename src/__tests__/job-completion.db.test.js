/**
 * @jest-environment node
 *
 * Job photos and completion against a real Postgres. Needs TEST_DATABASE_URL
 * pointing at a local, disposable database whose name contains "test" (every
 * table used here is truncated). S3 is replaced by an in-memory store; signed
 * URLs are still produced by the real AWS presigner. Run with:
 * npm run test:completion
 */
import { NextRequest } from 'next/server';
import { execSync } from 'child_process';

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
process.env.JWT_SECRET = 'job-completion-test-secret';
process.env.ADMIN_EMAILS = 'owner@scoopify.club';
process.env.AWS_REGION = 'us-west-2';
process.env.AWS_ACCESS_KEY_ID = 'AKIATESTTESTTESTTEST';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-access-key';
process.env.AWS_BUCKET_NAME = 'scoopify-photos-test';

const mockS3Objects = new Map();
const mockS3Calls = [];
jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3');
  actual.S3Client.prototype.send = async function send(command) {
    const name = command.constructor.name;
    const input = command.input;
    mockS3Calls.push({ name, input });
    const object = mockS3Objects.get(input.Key);
    switch (name) {
      case 'PutObjectCommand':
        mockS3Objects.set(input.Key, { body: Buffer.from(input.Body), contentType: input.ContentType });
        return {};
      case 'HeadObjectCommand':
        if (!object) throw Object.assign(new Error('NotFound'), { name: 'NotFound', $metadata: { httpStatusCode: 404 } });
        return { ContentLength: object.body.length, ContentType: object.contentType };
      case 'GetObjectCommand': {
        const [, start, end] = /bytes=(\d+)-(\d+)/.exec(input.Range || 'bytes=0-999999999');
        const bytes = object.body.subarray(Number(start), Number(end) + 1);
        return { Body: { transformToByteArray: async () => new Uint8Array(bytes) } };
      }
      case 'DeleteObjectCommand':
        mockS3Objects.delete(input.Key);
        return {};
      default:
        throw new Error(`Unexpected S3 command ${name}`);
    }
  };
  return actual;
});

jest.unmock('@/lib/prisma');
jest.mock('@/lib/unified-email-service', () => ({
  sendServiceClaimedEmail: jest.fn(async () => ({ success: true })),
  sendServiceCompletedEmail: jest.fn(async () => ({ success: true })),
}));

const describeDb = TEST_DATABASE_URL ? describe : describe.skip;
if (!TEST_DATABASE_URL) {
  console.warn('Skipping job-completion DB tests: set TEST_DATABASE_URL (see npm run test:completion).');
}

const BASE = 'http://localhost:3000';
const ZIP = '80831';
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]), Buffer.alloc(2048, 7)]);
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(512, 1)]);
const CHECKLIST = { allWasteRemoved: true, gateClosed: true, cornersChecked: true };
// $79/month plan: per visit $79 x 12 / 52 = $18.23, scooper 75% = $13.67,
// Stripe fee ($79 x 2.9% + $0.30) x 12 / 52 = $0.60, retained $3.96
const EXPECTED_EARNING = 13.67;
const EXPECTED_RECORD = {
  pricingBasis: 'SUBSCRIPTION_WEEKLY',
  planPriceCents: 7900,
  customerPriceCents: 1823,
  scooperEarningCents: 1367,
  referralExpenseCents: 0,
  stripeFeeCents: 60,
  stripeFeeEstimated: true,
  retainedContributionCents: 396,
  adjustments: [],
  payoutStatus: 'PENDING',
  stripeTransferId: null,
};

describeDb('job photos and completion (real Postgres)', () => {
  let prisma;
  let createUserToken;
  let email;
  let routes;
  let seq = 0;

  beforeAll(async () => {
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: 'pipe',
    });
    ({ prisma } = require('@/lib/prisma'));
    ({ createUserToken } = require('@/lib/jwt-utils'));
    email = require('@/lib/unified-email-service');
    routes = {
      claim: require('@/app/api/employee/services/[id]/claim/route'),
      arrive: require('@/app/api/employee/services/[id]/arrive/route'),
      photos: require('@/app/api/employee/services/[id]/photos/route'),
      uploadUrl: require('@/app/api/employee/services/[id]/photos/upload-url/route'),
      servicePhotos: require('@/app/api/services/[id]/photos/route'),
      jobPhotos: require('@/app/api/employee/jobs/[jobId]/photos/route'),
      uploadPhoto: require('@/app/api/upload-photo/route'),
      complete: require('@/app/api/employee/services/[id]/complete/route'),
      servicesComplete: require('@/app/api/services/[id]/complete/route'),
      status: require('@/app/api/employee/services/[id]/status/route'),
      checklist: require('@/app/api/services/[id]/checklist/route'),
      evidence: require('@/app/api/admin/services/[id]/completion/route'),
      adminPhotos: require('@/app/api/admin/photos/route'),
      share: require('@/app/api/photos/share/route'),
      customerServices: require('@/app/api/customer/services/route'),
    };
  }, 120000);

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "JobFinancialRecord", "ServicePhoto", "ServiceChecklist", "Earning", "Location", "Service", "CoverageArea", "Address", "Customer", "Employee", "User", "ServicePlan", "Subscription", "SystemLog", "Notification", "RateLimit" CASCADE'
    );
    mockS3Objects.clear();
    mockS3Calls.length = 0;
    email.sendServiceCompletedEmail.mockClear();
  });

  const id = (prefix) => `${prefix}-${++seq}-${Math.random().toString(36).slice(2, 8)}`;

  async function createScooper() {
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
      data: { id: id('emp'), userId: user.id, status: 'ACTIVE', hasSetServiceArea: true, approvedAt: new Date(), updatedAt: new Date() },
    });
    await prisma.coverageArea.create({ data: { id: id('area'), zipCode: ZIP, employeeId: employee.id, updatedAt: new Date() } });
    const token = await createUserToken({ id: user.id, email: user.email, role: 'EMPLOYEE' });
    return { user, employee, token };
  }

  async function createCustomer({ serviceCredits = 4 } = {}) {
    const user = await prisma.user.create({
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
        userId: user.id,
        gateCode: '1234',
        serviceCredits,
        updatedAt: new Date(),
        address: { create: { id: id('addr'), street: '1 Main St', city: 'Peyton', state: 'CO', zipCode: ZIP, updatedAt: new Date() } },
      },
    });
    const token = await createUserToken({ id: user.id, email: user.email, role: 'CUSTOMER' });
    return { user, customer, token };
  }

  async function createJob(customer, { price = 79, type = 'MONTHLY' } = {}) {
    const owner = customer || (await createCustomer());
    const plan = await prisma.servicePlan.create({
      data: { id: id('plan'), name: 'Weekly', price, duration: 30, type, updatedAt: new Date() },
    });
    const service = await prisma.service.create({
      data: {
        id: id('svc'),
        customerId: owner.customer.id,
        servicePlanId: plan.id,
        scheduledDate: new Date(Date.now() + 60 * 60 * 1000),
        status: 'SCHEDULED',
        notes: 'Side gate',
        potentialEarnings: 39.83,
        updatedAt: new Date(),
      },
    });
    return { service, owner };
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
    return { user, token: await createUserToken(user) };
  }

  function req(path, { method = 'GET', token, bearer, body, form } = {}) {
    const headers = new Headers();
    if (token) headers.set('cookie', `accessToken=${token}`);
    if (bearer) headers.set('authorization', `Bearer ${bearer}`);
    let payload;
    if (form) payload = form;
    else if (body !== undefined) {
      headers.set('content-type', 'application/json');
      payload = JSON.stringify(body);
    }
    return new NextRequest(`${BASE}${path}`, { method, headers, body: payload });
  }

  const params = (value) => ({ params: Promise.resolve(value) });

  function photoForm({ bytes = JPEG, contentType = 'image/jpeg', type = 'BEFORE', field = 'file', name = 'photo.jpg' } = {}) {
    const form = new FormData();
    form.append(field, new File([bytes], name, { type: contentType }));
    form.append('type', type);
    return form;
  }

  const upload = (serviceId, scooper, options) =>
    routes.photos.POST(req(`/api/employee/services/${serviceId}/photos`, { method: 'POST', bearer: scooper.token, form: photoForm(options) }), params({ id: serviceId }));

  const complete = (serviceId, scooper, body = { checklist: CHECKLIST }) =>
    routes.complete.POST(req(`/api/employee/services/${serviceId}/complete`, { method: 'POST', bearer: scooper.token, body }), params({ id: serviceId }));

  /** A job claimed and checked in by a fresh scooper. */
  async function activeJob(customer, plan) {
    const scooper = await createScooper();
    const { service, owner } = await createJob(customer, plan);
    expect((await routes.claim.POST(req(`/api/employee/services/${service.id}/claim`, { method: 'POST', bearer: scooper.token }), params({ id: service.id }))).status).toBe(200);
    expect((await routes.arrive.POST(req(`/api/employee/services/${service.id}/arrive`, { method: 'POST', bearer: scooper.token, body: {} }), params({ id: service.id }))).status).toBe(200);
    return { scooper, service, owner };
  }

  async function uploadRequiredPhotos(serviceId, scooper) {
    for (const type of ['BEFORE', 'BEFORE', 'BEFORE', 'BEFORE', 'AFTER', 'AFTER', 'AFTER', 'AFTER']) {
      expect((await upload(serviceId, scooper, { type })).status).toBe(201);
    }
  }

  const expectSignedUrl = (url, expiresSeconds) => {
    const parsed = new URL(url);
    expect(parsed.hostname).toContain('scoopify-photos-test');
    expect(parsed.searchParams.get('X-Amz-Signature')).toBeTruthy();
    expect(parsed.searchParams.get('X-Amz-Expires')).toBe(String(expiresSeconds));
  };

  describe('photo upload', () => {
    test('the assigned scooper uploads a private photo after check-in', async () => {
      const { scooper, service } = await activeJob();
      const res = await upload(service.id, scooper, { type: 'BEFORE' });
      expect(res.status).toBe(201);
      const { photo } = await res.json();
      expect(photo).toMatchObject({ type: 'BEFORE', contentType: 'image/jpeg', sizeBytes: JPEG.length });
      expectSignedUrl(photo.url, 300);
      expect(photo).not.toHaveProperty('s3Key');

      const put = mockS3Calls.find((call) => call.name === 'PutObjectCommand');
      expect(put.input.Key).toMatch(new RegExp(`^services/${service.id}/before/[0-9a-f-]{36}\\.jpg$`));
      expect(put.input).not.toHaveProperty('ACL');
      expect(put.input.ServerSideEncryption).toBe('AES256');

      const row = await prisma.servicePhoto.findUnique({ where: { id: photo.id } });
      expect(row).toMatchObject({ s3Key: put.input.Key, url: put.input.Key, uploadedById: scooper.employee.id });
    });

    test('legacy upload routes and field names go through the same path', async () => {
      const { scooper, service } = await activeJob();
      const form = photoForm({ field: 'photo', type: 'POST_SERVICE', bytes: PNG, contentType: 'image/png', name: 'x.png' });
      form.append('serviceId', service.id);
      const res = await routes.uploadPhoto.POST(req('/api/upload-photo', { method: 'POST', token: scooper.token, form }));
      expect(res.status).toBe(201);
      expect((await res.json()).photo).toMatchObject({ type: 'AFTER', contentType: 'image/png' });

      const viaServices = await routes.servicePhotos.POST(
        req(`/api/services/${service.id}/photos`, { method: 'POST', token: scooper.token, form: photoForm({ type: 'PRE_SERVICE' }) }),
        params({ id: service.id })
      );
      expect(viaServices.status).toBe(201);
      expect(await prisma.servicePhoto.count({ where: { serviceId: service.id } })).toBe(2);
    });

    test('uploads are refused before check-in, for other scoopers, and for customers', async () => {
      const scooper = await createScooper();
      const other = await createScooper();
      const { service, owner } = await createJob();
      await routes.claim.POST(req(`/api/employee/services/${service.id}/claim`, { method: 'POST', bearer: scooper.token }), params({ id: service.id }));

      const early = await upload(service.id, scooper);
      expect(early.status).toBe(409);
      expect((await early.json()).code).toBe('NOT_CHECKED_IN');

      await routes.arrive.POST(req(`/api/employee/services/${service.id}/arrive`, { method: 'POST', bearer: scooper.token, body: {} }), params({ id: service.id }));
      const wrongScooper = await upload(service.id, other);
      expect(wrongScooper.status).toBe(403);
      expect((await upload(service.id, owner)).status).toBe(401);
      expect((await upload(service.id, {})).status).toBe(401);
      expect(mockS3Objects.size).toBe(0);
    });

    test('type and size are validated, including the file contents', async () => {
      const { scooper, service } = await activeJob();
      const cases = [
        [{ contentType: 'text/plain', bytes: Buffer.from('hello'), name: 'a.txt' }, 415, 'UNSUPPORTED_PHOTO_TYPE'],
        [{ contentType: 'image/jpeg', bytes: Buffer.from('<?php echo 1; ?>'), name: 'a.jpg' }, 415, 'PHOTO_CONTENT_MISMATCH'],
        [{ contentType: 'image/png', bytes: JPEG }, 415, 'PHOTO_CONTENT_MISMATCH'],
        [{ type: 'SELFIE' }, 400, 'INVALID_PHOTO_TYPE'],
        [{ bytes: Buffer.alloc(0) }, 400, 'PHOTO_EMPTY'],
        [{ bytes: Buffer.concat([JPEG, Buffer.alloc(4 * 1024 * 1024)]) }, 413, 'PHOTO_TOO_LARGE'],
      ];
      for (const [options, status, code] of cases) {
        const res = await upload(service.id, scooper, options);
        const body = await res.json();
        expect({ code, status: res.status, got: body.code }).toEqual({ code, status, got: code });
      }
      expect(mockS3Objects.size).toBe(0);
      expect(await prisma.servicePhoto.count()).toBe(0);
    });

    test('direct upload: signed PUT URL, then confirm checks the stored object', async () => {
      const { scooper, service } = await activeJob();
      const ask = (body) =>
        routes.uploadUrl.POST(req(`/api/employee/services/${service.id}/photos/upload-url`, { method: 'POST', bearer: scooper.token, body }), params({ id: service.id }));
      const confirm = (body) =>
        routes.photos.POST(req(`/api/employee/services/${service.id}/photos`, { method: 'POST', bearer: scooper.token, body }), params({ id: service.id }));

      expect((await ask({ type: 'AFTER', contentType: 'image/gif', size: 100 })).status).toBe(415);
      expect((await ask({ type: 'AFTER', contentType: 'image/jpeg', size: 11 * 1024 * 1024 })).status).toBe(413);

      const res = await ask({ type: 'AFTER', contentType: 'image/jpeg', size: 6 * 1024 * 1024 });
      expect(res.status).toBe(200);
      const grant = await res.json();
      expect(grant).toMatchObject({
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg', 'x-amz-server-side-encryption': 'AES256' },
        expiresIn: 300,
      });
      expectSignedUrl(grant.uploadUrl, 300);
      const signed = new URL(grant.uploadUrl).searchParams;
      expect(signed.get('X-Amz-SignedHeaders').split(';').sort()).toEqual(['content-type', 'host', 'x-amz-server-side-encryption']);
      // A checksum signed at this point would be of an empty body and S3 would reject the real upload
      expect([...signed.keys()].some((k) => k.toLowerCase().startsWith('x-amz-checksum'))).toBe(false);
      expect(grant.key.startsWith(`services/${service.id}/after/`)).toBe(true);

      expect((await confirm({ key: grant.key, type: 'AFTER' })).status).toBe(400);

      mockS3Objects.set(grant.key, { body: Buffer.concat([JPEG, Buffer.alloc(6 * 1024 * 1024)]), contentType: 'image/jpeg' });
      const ok = await confirm({ key: grant.key, type: 'AFTER' });
      expect(ok.status).toBe(201);
      const { photo } = await ok.json();
      const again = await confirm({ key: grant.key, type: 'AFTER' });
      expect((await again.json()).photo.id).toBe(photo.id);
      expect(await prisma.servicePhoto.count()).toBe(1);

      const bad = (await (await ask({ type: 'BEFORE', contentType: 'image/jpeg', size: 1000 })).json()).key;
      mockS3Objects.set(bad, { body: Buffer.from('not an image at all'), contentType: 'image/jpeg' });
      const rejected = await confirm({ key: bad, type: 'BEFORE' });
      expect(rejected.status).toBe(415);
      expect(mockS3Objects.has(bad)).toBe(false);

      const other = await activeJob();
      const foreign = (await (await routes.uploadUrl.POST(
        req(`/api/employee/services/${other.service.id}/photos/upload-url`, { method: 'POST', bearer: other.scooper.token, body: { type: 'BEFORE', contentType: 'image/jpeg', size: 10 } }),
        params({ id: other.service.id })
      )).json()).key;
      const crossJob = await confirm({ key: foreign, type: 'BEFORE' });
      expect(crossJob.status).toBe(400);
      expect((await crossJob.json()).code).toBe('INVALID_PHOTO_KEY');
    });
  });

  describe('photo access', () => {
    test('only the assigned scooper, the job customer and admins can view photos', async () => {
      const { scooper, service, owner } = await activeJob();
      await upload(service.id, scooper, { type: 'BEFORE' });
      const otherScooper = await createScooper();
      const otherCustomer = await createCustomer();
      const admin = await createAdmin();

      const viewers = [
        ['assigned scooper', scooper.token, 200],
        ['job customer', owner.token, 200],
        ['admin', admin.token, 200],
        ['other scooper', otherScooper.token, 403],
        ['other customer', otherCustomer.token, 403],
        ['anonymous', undefined, 401],
      ];
      const getters = [
        ['employee/services/:id/photos', (token) => routes.photos.GET(req(`/api/employee/services/${service.id}/photos`, { token }), params({ id: service.id }))],
        ['services/:id/photos', (token) => routes.servicePhotos.GET(req(`/api/services/${service.id}/photos`, { bearer: token }), params({ id: service.id }))],
        ['employee/jobs/:jobId/photos', (token) => routes.jobPhotos.GET(req(`/api/employee/jobs/${service.id}/photos`, { bearer: token }), params({ jobId: service.id }))],
        ['services/:id/checklist', (token) => routes.checklist.GET(req(`/api/services/${service.id}/checklist`, { token }), params({ id: service.id }))],
      ];
      for (const [route, get] of getters) {
        for (const [who, token, expected] of viewers) {
          const res = await get(token);
          expect({ route, who, status: res.status }).toEqual({ route, who, status: expected });
          if (expected === 200 && route.endsWith('photos')) {
            const body = await res.json();
            expect(body.photos).toHaveLength(1);
            expectSignedUrl(body.photos[0].url, 300);
            expect(JSON.stringify(body)).not.toContain('s3Key');
          }
        }
      }
    });

    test('a scooper who is no longer assigned loses access', async () => {
      const { scooper, service } = await activeJob();
      await upload(service.id, scooper);
      await prisma.service.update({ where: { id: service.id }, data: { employeeId: null, status: 'SCHEDULED' } });
      const res = await routes.photos.GET(req(`/api/employee/services/${service.id}/photos`, { bearer: scooper.token }), params({ id: service.id }));
      expect(res.status).toBe(403);
    });

    test('customers cannot delete photos; the scooper can while in progress', async () => {
      const { scooper, service, owner } = await activeJob();
      const { photo } = await (await upload(service.id, scooper)).json();
      const del = (token) =>
        routes.servicePhotos.DELETE(req(`/api/services/${service.id}/photos`, { method: 'DELETE', bearer: token, body: { photoId: photo.id } }), params({ id: service.id }));
      expect((await del(owner.token)).status).toBe(403);
      expect((await del(scooper.token)).status).toBe(200);
      expect(mockS3Objects.size).toBe(0);
    });

    test('public photo sharing is disabled', async () => {
      expect((await routes.share.GET(req('/api/photos/share?token=x'))).status).toBe(410);
      expect((await routes.share.POST(req('/api/photos/share', { method: 'POST', body: { photoId: 'x', title: 't' } }))).status).toBe(410);
    });
  });

  describe('completion', () => {
    test('requires the checklist and 4 before + 4 after photos', async () => {
      const { scooper, service } = await activeJob();

      let res = await complete(service.id, scooper, { checklist: { allWasteRemoved: true } });
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ code: 'CHECKLIST_INCOMPLETE', missingItems: ['gateClosed'] });

      await upload(service.id, scooper, { type: 'BEFORE' });
      res = await complete(service.id, scooper);
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({
        code: 'PHOTOS_REQUIRED',
        missingPhotos: [{ type: 'BEFORE', required: 4, uploaded: 1 }, { type: 'AFTER', required: 4, uploaded: 0 }],
      });

      // A legacy row without a stored object does not count
      await prisma.servicePhoto.create({ data: { id: id('legacy'), url: 'blob:http://x/1', type: 'AFTER', serviceId: service.id, updatedAt: new Date() } });
      res = await complete(service.id, scooper);
      expect((await res.json()).missingPhotos[1]).toEqual({ type: 'AFTER', required: 4, uploaded: 0 });

      const row = await prisma.service.findUnique({ where: { id: service.id } });
      expect(row.status).toBe('IN_PROGRESS');
      expect(await prisma.earning.count()).toBe(0);
      expect(email.sendServiceCompletedEmail).not.toHaveBeenCalled();
    });

    test('completes once: status, timestamps, 1 earning, 1 email with photos, slot freed', async () => {
      const customer = await createCustomer({ serviceCredits: 1 });
      const { scooper, service, owner } = await activeJob(customer);
      await uploadRequiredPhotos(service.id, scooper);
      const arrivedAt = new Date(Date.now() - 25 * 60 * 1000);
      await prisma.service.update({ where: { id: service.id }, data: { arrivedAt } });

      const before = Date.now();
      const res = await complete(service.id, scooper, { checklist: ['allWasteRemoved', 'gateClosedOnExit'], notes: 'Two piles by the shed' });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({
        success: true,
        alreadyCompleted: false,
        earning: { amount: EXPECTED_EARNING, status: 'PENDING' },
        financialRecord: EXPECTED_RECORD,
        photoCounts: { BEFORE: 4, AFTER: 4 },
        email: { sent: true, outcome: 'sent' },
      });

      const row = await prisma.service.findUnique({ where: { id: service.id }, include: { checklist: true } });
      expect(row).toMatchObject({ status: 'COMPLETED', workflowStatus: 'COMPLETED', checklistCompleted: true, notes: 'Side gate' });
      expect(row.completedDate.getTime()).toBeGreaterThanOrEqual(before - 1000);
      expect(row.beforePhotoIds).toHaveLength(4);
      expect(row.afterPhotoIds).toHaveLength(4);
      expect(row.checklist).toMatchObject({ items: { allWasteRemoved: true, gateClosed: true }, notes: 'Two piles by the shed' });
      expect(row.checklist.completedAt).toBeInstanceOf(Date);

      const records = await prisma.jobFinancialRecord.findMany();
      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject({
        ...EXPECTED_RECORD,
        serviceId: service.id,
        employeeId: scooper.employee.id,
        customerId: owner.customer.id,
        checkedInAt: arrivedAt,
        completedAt: row.completedDate,
      });
      expect(records[0].serviceDurationSeconds).toBeGreaterThanOrEqual(25 * 60);
      expect(records[0].serviceDurationSeconds).toBeLessThan(26 * 60);

      const earnings = await prisma.earning.findMany();
      expect(earnings).toHaveLength(1);
      expect(earnings[0]).toMatchObject({ serviceId: service.id, employeeId: scooper.employee.id, amount: EXPECTED_EARNING, status: 'PENDING', paidAt: null, stripeTransferId: null });
      expect((await prisma.employee.findUnique({ where: { id: scooper.employee.id } })).completedJobs).toBe(1);
      expect(await prisma.customer.findUnique({ where: { id: owner.customer.id } })).toMatchObject({ serviceCredits: 0 });
      expect((await prisma.customer.findUnique({ where: { id: owner.customer.id } })).creditsDepletedAt).toBeInstanceOf(Date);
      expect(await prisma.notification.count({ where: { userId: owner.user.id, type: 'SERVICE_COMPLETED' } })).toBe(1);

      expect(email.sendServiceCompletedEmail).toHaveBeenCalledTimes(1);
      const [emailService, emailScooper, { photos }] = email.sendServiceCompletedEmail.mock.calls[0];
      expect(emailService.customer.user.email).toBe(owner.user.email);
      expect(emailScooper.user.firstName).toBe('Sam');
      expect(photos).toHaveLength(8);
      photos.forEach((photo) => expectSignedUrl(photo.url, 7 * 24 * 60 * 60));
      expect(await prisma.systemLog.count({ where: { type: 'SERVICE_COMPLETION_EMAIL' } })).toBe(1);

      // Repeat: same result, nothing new
      const again = await complete(service.id, scooper);
      expect(again.status).toBe(200);
      expect(await again.json()).toMatchObject({ alreadyCompleted: true, earning: { amount: EXPECTED_EARNING } });
      expect(await prisma.earning.count()).toBe(1);
      expect(await prisma.jobFinancialRecord.count()).toBe(1);
      expect(email.sendServiceCompletedEmail).toHaveBeenCalledTimes(1);
      expect((await prisma.employee.findUnique({ where: { id: scooper.employee.id } })).completedJobs).toBe(1);

      // Photos can no longer be added, but stay visible to the scooper
      expect((await upload(service.id, scooper)).status).toBe(409);
      expect((await routes.photos.GET(req(`/api/employee/services/${service.id}/photos`, { bearer: scooper.token }), params({ id: service.id }))).status).toBe(200);

      // The one-active-job slot is free: the scooper can claim the next job
      const next = await createJob();
      const claimNext = await routes.claim.POST(req(`/api/employee/services/${next.service.id}/claim`, { method: 'POST', bearer: scooper.token }), params({ id: next.service.id }));
      expect(claimNext.status).toBe(200);
    });

    test('concurrent completions record one earning and send one email', async () => {
      const { scooper, service } = await activeJob();
      await uploadRequiredPhotos(service.id, scooper);
      const responses = await Promise.all(Array.from({ length: 6 }, (_, i) =>
        i % 2
          ? complete(service.id, scooper)
          : routes.servicesComplete.POST(req(`/api/services/${service.id}/complete`, { method: 'POST', token: scooper.token, body: { checklist: CHECKLIST } }), params({ id: service.id }))
      ));
      expect(responses.map((r) => r.status)).toEqual([200, 200, 200, 200, 200, 200]);
      const bodies = await Promise.all(responses.map((r) => r.json()));
      expect(bodies.filter((b) => b.alreadyCompleted === false)).toHaveLength(1);
      expect(await prisma.earning.count({ where: { serviceId: service.id } })).toBe(1);
      expect(await prisma.jobFinancialRecord.count({ where: { serviceId: service.id } })).toBe(1);
      expect(email.sendServiceCompletedEmail).toHaveBeenCalledTimes(1);
    });

    test('another scooper, a customer, or a job not checked in cannot be completed', async () => {
      const { scooper, service, owner } = await activeJob();
      await uploadRequiredPhotos(service.id, scooper);
      const other = await createScooper();
      expect((await complete(service.id, other)).status).toBe(403);
      expect((await complete(service.id, owner)).status).toBe(401);

      const pendingScooper = await createScooper();
      const pending = await createJob();
      await routes.claim.POST(req(`/api/employee/services/${pending.service.id}/claim`, { method: 'POST', bearer: pendingScooper.token }), params({ id: pending.service.id }));
      const res = await complete(pending.service.id, pendingScooper);
      expect(res.status).toBe(409);
      expect((await res.json()).code).toBe('NOT_CHECKED_IN');
      expect(await prisma.earning.count()).toBe(0);
    });

    test('a saved checklist counts, and the status route uses the same rules', async () => {
      const { scooper, service } = await activeJob();
      const save = await routes.checklist.POST(
        req(`/api/services/${service.id}/checklist`, { method: 'POST', bearer: scooper.token, body: { checklist: CHECKLIST } }),
        params({ id: service.id })
      );
      expect(save.status).toBe(200);

      const statusComplete = () =>
        routes.status.POST(req(`/api/employee/services/${service.id}/status`, { method: 'POST', token: scooper.token, body: { status: 'COMPLETED' } }), params({ id: service.id }));
      const blocked = await statusComplete();
      expect(blocked.status).toBe(400);
      expect((await blocked.json()).code).toBe('PHOTOS_REQUIRED');

      await uploadRequiredPhotos(service.id, scooper);
      const done = await statusComplete();
      expect(done.status).toBe(200);
      expect((await done.json()).earning.amount).toBe(EXPECTED_EARNING);
    });

    test('admins can review completion evidence; others cannot', async () => {
      const { scooper, service, owner } = await activeJob();
      await uploadRequiredPhotos(service.id, scooper);
      await complete(service.id, scooper);
      const admin = await createAdmin();
      const get = (token) =>
        routes.evidence.GET(req(`/api/admin/services/${service.id}/completion`, { token }), params({ id: service.id }));

      expect((await get(scooper.token)).status).toBe(403);
      expect((await get(owner.token)).status).toBe(403);
      expect((await get(undefined)).status).toBe(401);
      const res = await get(admin.token);
      expect(res.status).toBe(200);
      const evidence = await res.json();
      expect(evidence.service).toMatchObject({ status: 'COMPLETED', checklist: { items: { allWasteRemoved: true, gateClosed: true } } });
      expect(evidence.photos).toHaveLength(8);
      evidence.photos.forEach((photo) => expectSignedUrl(photo.url, 300));
      expect(evidence.earning).toMatchObject({ amount: EXPECTED_EARNING });
      expect(evidence.financialRecord).toMatchObject(EXPECTED_RECORD);
      expect(evidence.emailLog[0].data).toMatchObject({ serviceId: service.id, outcome: 'sent' });

      const list = await routes.adminPhotos.GET(req(`/api/admin/photos?serviceId=${service.id}&limit=20`, { token: admin.token }));
      expect(list.status).toBe(200);
      expect((await list.json()).photos).toHaveLength(8);
      expect((await routes.adminPhotos.GET(req('/api/admin/photos', { token: scooper.token }))).status).toBe(403);
    });

    test('a one-time job records the full price and 75% of it', async () => {
      const { scooper, service } = await activeJob(undefined, { price: 99, type: 'ONE_TIME' });
      await uploadRequiredPhotos(service.id, scooper);
      expect((await complete(service.id, scooper)).status).toBe(200);
      expect(await prisma.jobFinancialRecord.findUnique({ where: { serviceId: service.id } })).toMatchObject({
        pricingBasis: 'ONE_TIME',
        customerPriceCents: 9900,
        scooperEarningCents: 7425,
        stripeFeeCents: 317,
        retainedContributionCents: 2158,
      });
      expect((await prisma.earning.findUnique({ where: { serviceId: service.id } })).amount).toBe(74.25);
    });

    test('adjustments recompute the retained contribution and keep a history', async () => {
      const { adjustFinancialRecord } = require('@/lib/job-financials');
      const { scooper, service } = await activeJob();
      await uploadRequiredPhotos(service.id, scooper);
      await complete(service.id, scooper);

      const at = new Date('2026-11-12T18:00:00Z');
      const updated = await adjustFinancialRecord({
        serviceId: service.id,
        changes: { referralExpenseCents: 2500 },
        reason: 'Referral reward for first paid visit',
        by: 'admin-1',
        now: at,
      });
      expect(updated).toMatchObject({ referralExpenseCents: 2500, retainedContributionCents: 396 - 2500 });
      expect(updated.adjustments).toEqual([
        { at: at.toISOString(), by: 'admin-1', reason: 'Referral reward for first paid visit', changes: { referralExpenseCents: { from: 0, to: 2500 } } },
      ]);

      await expect(adjustFinancialRecord({ serviceId: service.id, changes: { scooperEarningCents: 1500 } })).rejects.toThrow('reason');
      await expect(adjustFinancialRecord({ serviceId: service.id, changes: { retainedContributionCents: 1 }, reason: 'x' })).rejects.toThrow();
      await prisma.jobFinancialRecord.update({ where: { serviceId: service.id }, data: { stripeTransferId: 'tr_123', payoutStatus: 'PAID' } });
      await expect(adjustFinancialRecord({ serviceId: service.id, changes: { scooperEarningCents: 1500 }, reason: 'x' })).rejects.toThrow('paid out');
    });

    describe('service credits: one per visit', () => {
      async function subscribedCustomer(serviceCredits) {
        const owner = await createCustomer({ serviceCredits });
        const plan = await prisma.servicePlan.create({
          data: { id: id('plan'), name: 'Weekly', price: 79, duration: 30, type: 'MONTHLY', updatedAt: new Date() },
        });
        const subscription = await prisma.subscription.create({
          data: { id: id('sub'), customerId: owner.customer.id, planId: plan.id, startDate: new Date(), updatedAt: new Date() },
        });
        await prisma.customer.update({ where: { id: owner.customer.id }, data: { subscriptionId: subscription.id } });
        return { owner, plan };
      }

      const book = (owner, plan, extra = {}) =>
        routes.customerServices.POST(
          req('/api/customer/services', {
            method: 'POST',
            token: owner.token,
            body: { scheduledDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(), servicePlanId: plan.id, ...extra },
          })
        );
      const credits = async (owner) => (await prisma.customer.findUnique({ where: { id: owner.customer.id } })).serviceCredits;

      async function claimCheckInAndComplete(serviceId) {
        const scooper = await createScooper();
        expect((await routes.claim.POST(req(`/api/employee/services/${serviceId}/claim`, { method: 'POST', bearer: scooper.token }), params({ id: serviceId }))).status).toBe(200);
        expect((await routes.arrive.POST(req(`/api/employee/services/${serviceId}/arrive`, { method: 'POST', bearer: scooper.token, body: {} }), params({ id: serviceId }))).status).toBe(200);
        await uploadRequiredPhotos(serviceId, scooper);
        expect((await complete(serviceId, scooper)).status).toBe(200);
        expect((await complete(serviceId, scooper)).status).toBe(200);
        return scooper;
      }

      test('a one-off booking uses its credit at booking and not again at completion', async () => {
        const { owner, plan } = await subscribedCustomer(2);
        const res = await book(owner, plan);
        expect(res.status).toBe(201);
        const booked = await res.json();
        expect(await credits(owner)).toBe(1);
        expect((await prisma.service.findUnique({ where: { id: booked.id } })).creditUsedAt).not.toBeNull();
        expect(booked.potentialEarnings).toBe(EXPECTED_EARNING);

        await claimCheckInAndComplete(booked.id);
        expect(await credits(owner)).toBe(1);
        expect((await prisma.service.findUnique({ where: { id: booked.id } })).status).toBe('COMPLETED');
      });

      test('a visit not paid for at booking uses one credit at completion, once', async () => {
        const { owner, plan } = await subscribedCustomer(2);
        const res = await book(owner, plan, { isRecurring: true });
        expect(res.status).toBe(201);
        expect(await credits(owner)).toBe(1);
        const followUp = await prisma.service.findFirst({ where: { customerId: owner.customer.id, creditUsedAt: null } });
        expect(followUp).not.toBeNull();

        await claimCheckInAndComplete(followUp.id);
        expect(await credits(owner)).toBe(0);
        expect((await prisma.service.findUnique({ where: { id: followUp.id } })).creditUsedAt).not.toBeNull();
        expect((await prisma.customer.findUnique({ where: { id: owner.customer.id } })).creditsDepletedAt).not.toBeNull();
      });

      test('booking without credits is refused and creates nothing', async () => {
        const { owner, plan } = await subscribedCustomer(0);
        expect((await book(owner, plan)).status).toBe(400);
        expect(await prisma.service.count({ where: { customerId: owner.customer.id } })).toBe(0);
        expect(await credits(owner)).toBe(0);
      });

      test('two bookings racing for the last credit: one succeeds, nothing goes negative', async () => {
        const { owner, plan } = await subscribedCustomer(1);
        const statuses = (await Promise.all([book(owner, plan), book(owner, plan)])).map((r) => r.status).sort();
        expect(statuses).toEqual([201, 400]);
        expect(await credits(owner)).toBe(0);
        expect(await prisma.service.count({ where: { customerId: owner.customer.id } })).toBe(1);
      });

      test('completing with no credit left still completes and is logged', async () => {
        const owner = await createCustomer({ serviceCredits: 0 });
        const { scooper, service } = await activeJob(owner);
        await uploadRequiredPhotos(service.id, scooper);
        expect((await complete(service.id, scooper)).status).toBe(200);
        expect(await credits(owner)).toBe(0);
        expect((await prisma.service.findUnique({ where: { id: service.id } })).creditUsedAt).toBeNull();
        expect(await prisma.systemLog.count({ where: { type: 'SERVICE_CREDIT_UNAVAILABLE' } })).toBe(1);
      });
    });

    test('an email failure does not undo the completion and is logged', async () => {
      email.sendServiceCompletedEmail.mockResolvedValueOnce({ success: false, skipped: true, reason: 'EMAIL_NOT_CONFIGURED' });
      const { scooper, service } = await activeJob();
      await uploadRequiredPhotos(service.id, scooper);
      const res = await complete(service.id, scooper);
      expect(res.status).toBe(200);
      expect((await res.json()).email).toMatchObject({ sent: false, outcome: 'skipped', reason: 'EMAIL_NOT_CONFIGURED' });
      expect((await prisma.service.findUnique({ where: { id: service.id } })).status).toBe('COMPLETED');
      expect(await prisma.earning.count()).toBe(1);
    });
  });
});
