/**
 * @jest-environment node
 *
 * cleanup-photos against an in-memory Prisma stand-in: only due tasks run,
 * and only photos past their 7-day expiresAt are deleted.
 */
import { NextRequest } from 'next/server';

const CRON_SECRET = 'cleanup-photos-test-secret';
process.env.CRON_SECRET = CRON_SECRET;

const DAY = 24 * 60 * 60 * 1000;
const mockState = { tasks: [], photos: [] };
const mockDeleteFromS3 = jest.fn(async () => {});

jest.mock('@/lib/s3', () => ({
  deleteFromS3: (...args) => mockDeleteFromS3(...args),
  isStorageConfigured: () => true,
}));

jest.mock('@/lib/prisma', () => {
  const lte = (value, bound) => value != null && value <= bound;
  const db = {
    cleanupTask: {
      findMany: async ({ where }) =>
        mockState.tasks.filter(
          (t) => t.taskType === where.taskType && t.status === where.status && lte(t.scheduledFor, where.scheduledFor.lte)
        ),
      update: async ({ where, data }) => Object.assign(mockState.tasks.find((t) => t.id === where.id), data),
    },
    servicePhoto: {
      findMany: async ({ where }) =>
        mockState.photos.filter((p) => p.serviceId === where.serviceId && lte(p.expiresAt, where.expiresAt.lte)),
      deleteMany: async ({ where }) => {
        const before = mockState.photos.length;
        mockState.photos = mockState.photos.filter((p) => !where.id.in.includes(p.id));
        return { count: before - mockState.photos.length };
      },
    },
  };
  return { __esModule: true, default: db, prisma: db };
});

const { GET } = require('@/app/api/cron/cleanup-photos/route');

function cronRequest() {
  return new NextRequest('http://localhost:3000/api/cron/cleanup-photos', {
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
}

describe('/api/cron/cleanup-photos', () => {
  it('purges only photos older than 7 days, for due tasks only', async () => {
    const now = Date.now();
    const ago = (days) => new Date(now - days * DAY);
    const expires = (uploadedDaysAgo) => new Date(now - uploadedDaysAgo * DAY + 7 * DAY);
    mockState.tasks = [
      { id: 'due', taskType: 'PHOTO_CLEANUP', status: 'PENDING', scheduledFor: ago(1), targetId: 'svc-old' },
      { id: 'future', taskType: 'PHOTO_CLEANUP', status: 'PENDING', scheduledFor: new Date(now + DAY), targetId: 'svc-new' },
    ];
    mockState.photos = [
      { id: 'old-s3', serviceId: 'svc-old', s3Key: 'services/svc-old/after/a.jpg', expiresAt: expires(8) },
      { id: 'old-inline', serviceId: 'svc-old', s3Key: null, expiresAt: expires(9) },
      { id: 'young', serviceId: 'svc-old', s3Key: null, expiresAt: expires(6) },
      { id: 'no-expiry', serviceId: 'svc-old', s3Key: null, expiresAt: null },
      { id: 'other-job', serviceId: 'svc-new', s3Key: null, expiresAt: expires(8) },
    ];

    const res = await GET(cronRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results).toEqual({ processed: 1, photosDeleted: 2, errors: [] });
    expect(mockState.photos.map((p) => p.id).sort()).toEqual(['no-expiry', 'other-job', 'young']);
    expect(mockDeleteFromS3).toHaveBeenCalledTimes(1);
    expect(mockDeleteFromS3).toHaveBeenCalledWith('services/svc-old/after/a.jpg');
    expect(mockState.tasks.find((t) => t.id === 'due').status).toBe('COMPLETED');
    expect(mockState.tasks.find((t) => t.id === 'future').status).toBe('PENDING');
  });
});
