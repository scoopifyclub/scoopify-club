import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma as defaultDb } from '@/lib/prisma';
import { validateUserToken } from '@/lib/jwt-utils';
import { requireAdmin } from '@/lib/admin-auth';
import { JobClaimError, jobClaimErrorResponse, getRequestToken, requireScooper } from '@/lib/job-claims';
import * as storage from '@/lib/s3';

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
// Vercel rejects function request bodies over 4.5 MB, so bigger photos have to
// go straight to S3 through a signed upload URL.
export const MAX_PROXY_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_PHOTOS_PER_SERVICE = 16;
export const PHOTO_CONTENT_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

// Older clients send their own names for the PhotoType enum values.
const PHOTO_TYPE_ALIASES = {
  BEFORE: 'BEFORE',
  PRE_SERVICE: 'BEFORE',
  PRE_CLEAN: 'BEFORE',
  AFTER: 'AFTER',
  POST_SERVICE: 'AFTER',
  POST_CLEAN: 'AFTER',
  ISSUE: 'ISSUE',
  OTHER: 'OTHER',
  GATE: 'OTHER',
};

const NO_STORE = { 'Cache-Control': 'private, no-store' };

export function normalizePhotoType(type) {
  const normalized = PHOTO_TYPE_ALIASES[String(type ?? '').trim().toUpperCase()];
  if (!normalized) {
    throw new JobClaimError(400, 'INVALID_PHOTO_TYPE', 'Photo type must be BEFORE, AFTER, ISSUE or OTHER');
  }
  return normalized;
}

/** Image type from the file's leading bytes, or null if it is not an allowed image. */
export function sniffImageType(bytes) {
  const b = Buffer.from(bytes);
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (b.length >= 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return 'image/webp';
  if (b.length >= 12 && b.toString('latin1', 4, 8) === 'ftyp') {
    const brand = b.toString('latin1', 8, 12);
    if (['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis'].includes(brand)) return 'image/heic';
    if (['mif1', 'msf1'].includes(brand)) return 'image/heif';
  }
  return null;
}

const isHeif = (type) => type === 'image/heic' || type === 'image/heif';

function assertContentMatches(bytes, declared) {
  const sniffed = sniffImageType(bytes);
  if (!sniffed || (sniffed !== declared && !(isHeif(sniffed) && isHeif(declared)))) {
    throw new JobClaimError(415, 'PHOTO_CONTENT_MISMATCH', 'The file is not a valid JPEG, PNG, WebP or HEIC image');
  }
}

function normalizeContentType(contentType) {
  const type = String(contentType ?? '').toLowerCase().split(';')[0].trim();
  if (!PHOTO_CONTENT_TYPES[type]) {
    throw new JobClaimError(415, 'UNSUPPORTED_PHOTO_TYPE', 'Photos must be JPEG, PNG, WebP or HEIC images');
  }
  return type;
}

function assertSize(size, maxBytes) {
  const n = Number(size);
  if (!Number.isFinite(n) || n <= 0) {
    throw new JobClaimError(400, 'PHOTO_EMPTY', 'The photo is empty or its size is missing');
  }
  if (n > maxBytes) {
    throw new JobClaimError(413, 'PHOTO_TOO_LARGE', `Photos must be ${maxBytes / 1024 / 1024} MB or smaller`, {
      maxBytes,
      ...(maxBytes === MAX_PROXY_UPLOAD_BYTES && n <= MAX_PHOTO_BYTES && { useUploadUrl: true }),
    });
  }
  return n;
}

function assertStorage() {
  if (!storage.isStorageConfigured()) {
    throw new JobClaimError(503, 'STORAGE_NOT_CONFIGURED', 'Photo storage is not configured');
  }
}

function photoKey(serviceId, type, contentType) {
  return `services/${serviceId}/${type.toLowerCase()}/${randomUUID()}.${PHOTO_CONTENT_TYPES[contentType]}`;
}

/** The assigned scooper may add photos only while checked in to the job. */
async function assertCanUpload(db, serviceId, employeeId) {
  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: { id: true, employeeId: true, status: true, _count: { select: { photos: true } } },
  });
  if (!service) throw new JobClaimError(404, 'JOB_NOT_FOUND', 'Job not found');
  if (service.employeeId !== employeeId) throw new JobClaimError(403, 'NOT_ASSIGNED', 'This job is not assigned to you');
  if (service.status === 'PENDING') {
    throw new JobClaimError(409, 'NOT_CHECKED_IN', 'Check in to the job before uploading photos');
  }
  if (service.status !== 'IN_PROGRESS') {
    throw new JobClaimError(409, 'JOB_NOT_ACTIVE', `Photos cannot be added to a job with status ${service.status}`);
  }
  if (service._count.photos >= MAX_PHOTOS_PER_SERVICE) {
    throw new JobClaimError(409, 'PHOTO_LIMIT', `A job can have at most ${MAX_PHOTOS_PER_SERVICE} photos`);
  }
  return service;
}

async function recordPhoto(db, { serviceId, employeeId, key, type, contentType, size, now }) {
  const photo = await db.servicePhoto.create({
    data: {
      id: randomUUID(),
      url: key,
      s3Key: key,
      type,
      serviceId,
      contentType,
      sizeBytes: size,
      uploadedById: employeeId,
      createdAt: now,
      updatedAt: now,
    },
  });
  return toPhotoView(photo);
}

/** Step 1 of a direct upload: a short-lived signed PUT URL for one photo. */
export async function createPhotoUploadUrl({ serviceId, employeeId, type, contentType, size, db = defaultDb }) {
  const photoType = normalizePhotoType(type);
  const ct = normalizeContentType(contentType);
  assertSize(size, MAX_PHOTO_BYTES);
  assertStorage();
  await assertCanUpload(db, serviceId, employeeId);
  const key = photoKey(serviceId, photoType, ct);
  return {
    key,
    type: photoType,
    method: 'PUT',
    uploadUrl: await storage.getSignedUploadUrl(key, ct),
    headers: { 'Content-Type': ct },
    expiresIn: storage.UPLOAD_URL_TTL_SECONDS,
    maxBytes: MAX_PHOTO_BYTES,
  };
}

/**
 * Step 2 of a direct upload: checks the uploaded object's size, type and
 * leading bytes, then records it. Invalid objects are deleted. Confirming the
 * same key twice returns the existing photo.
 */
export async function confirmPhotoUpload({ serviceId, employeeId, key, type, now = new Date(), db = defaultDb }) {
  const photoType = normalizePhotoType(type);
  const prefix = `services/${serviceId}/${photoType.toLowerCase()}/`;
  if (typeof key !== 'string' || !key.startsWith(prefix) || !/^[A-Za-z0-9._/-]+$/.test(key) || key.includes('..')) {
    throw new JobClaimError(400, 'INVALID_PHOTO_KEY', 'Unknown upload key for this job and photo type');
  }
  const existing = await db.servicePhoto.findUnique({ where: { s3Key: key } });
  if (existing) return toPhotoView(existing);

  assertStorage();
  await assertCanUpload(db, serviceId, employeeId);
  const head = await storage.headObject(key);
  if (!head) throw new JobClaimError(400, 'PHOTO_NOT_UPLOADED', 'No uploaded file was found for this key');

  let contentType;
  try {
    contentType = normalizeContentType(head.contentType);
    assertSize(head.size, MAX_PHOTO_BYTES);
    assertContentMatches(await storage.readObjectPrefix(key), contentType);
  } catch (error) {
    await storage.deleteFromS3(key).catch((err) => console.error('Failed to delete rejected upload', key, err));
    throw error;
  }
  return recordPhoto(db, { serviceId, employeeId, key, type: photoType, contentType, size: head.size, now });
}

/** Upload through the API (multipart). Limited to MAX_PROXY_UPLOAD_BYTES. */
export async function uploadPhotoFile({ serviceId, employeeId, file, type, now = new Date(), db = defaultDb }) {
  const photoType = normalizePhotoType(type);
  if (!file || typeof file.arrayBuffer !== 'function') {
    throw new JobClaimError(400, 'PHOTO_FILE_REQUIRED', 'A photo file is required');
  }
  const contentType = normalizeContentType(file.type);
  assertSize(file.size, MAX_PROXY_UPLOAD_BYTES);
  assertStorage();
  await assertCanUpload(db, serviceId, employeeId);
  const body = Buffer.from(await file.arrayBuffer());
  const size = assertSize(body.length, MAX_PROXY_UPLOAD_BYTES);
  assertContentMatches(body, contentType);
  const key = photoKey(serviceId, photoType, contentType);
  await storage.putPrivateObject({ key, body, contentType });
  return recordPhoto(db, { serviceId, employeeId, key, type: photoType, contentType, size, now });
}

/**
 * Photo as returned to an authorized viewer: a signed URL that expires after
 * `ttlSeconds`, never the bucket key or a public URL.
 */
export async function toPhotoView(photo, { ttlSeconds = storage.VIEW_URL_TTL_SECONDS, now = new Date() } = {}) {
  const key = photo.s3Key || storage.keyFromLegacyUrl(photo.url);
  let url = null;
  let urlExpiresAt = null;
  if (key && storage.isStorageConfigured()) {
    url = await storage.getSignedDownloadUrl(key, ttlSeconds);
    urlExpiresAt = new Date(now.getTime() + ttlSeconds * 1000);
  } else if (typeof photo.url === 'string' && photo.url.startsWith('data:image/')) {
    url = photo.url;
  }
  return {
    id: photo.id,
    serviceId: photo.serviceId,
    type: photo.type,
    contentType: photo.contentType ?? null,
    sizeBytes: photo.sizeBytes ?? null,
    createdAt: photo.createdAt,
    url,
    urlExpiresAt,
  };
}

export async function listServicePhotos({ serviceId, db = defaultDb, ttlSeconds } = {}) {
  const photos = await db.servicePhoto.findMany({ where: { serviceId }, orderBy: { createdAt: 'asc' } });
  return Promise.all(photos.map((photo) => toPhotoView(photo, { ttlSeconds })));
}

export function groupPhotosByType(photos) {
  const grouped = { before: [], after: [], issue: [], other: [] };
  for (const photo of photos) grouped[photo.type.toLowerCase()]?.push(photo);
  return grouped;
}

/**
 * Who may see a job's photos: the scooper currently assigned to it, the
 * job's customer, and verified admins. Everyone else gets 403.
 */
export async function authorizePhotoViewer(request, serviceId, { db = defaultDb } = {}) {
  const token = await getRequestToken(request);
  const decoded = token ? await validateUserToken(token) : null;
  if (!decoded?.userId) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: { id: true, customerId: true, employeeId: true, status: true },
  });
  if (!service) {
    return { ok: false, response: NextResponse.json({ error: 'Job not found', code: 'JOB_NOT_FOUND' }, { status: 404 }) };
  }

  if (decoded.role === 'ADMIN') {
    const auth = await requireAdmin(request);
    return auth.ok ? { ok: true, role: 'ADMIN', userId: decoded.userId, service } : { ok: false, response: auth.response };
  }
  if (decoded.role === 'EMPLOYEE' && service.employeeId) {
    const employee = await db.employee.findUnique({ where: { userId: decoded.userId }, select: { id: true } });
    if (employee?.id === service.employeeId) return { ok: true, role: 'EMPLOYEE', userId: decoded.userId, employeeId: employee.id, service };
  }
  if (decoded.role === 'CUSTOMER') {
    const customer = await db.customer.findUnique({ where: { userId: decoded.userId }, select: { id: true } });
    if (customer?.id === service.customerId) return { ok: true, role: 'CUSTOMER', userId: decoded.userId, service };
  }
  return {
    ok: false,
    response: NextResponse.json(
      { error: 'You do not have access to this job\'s photos', code: 'PHOTO_ACCESS_DENIED' },
      { status: 403 }
    ),
  };
}

/** Removes a photo: the assigned scooper while the job is in progress, or an admin. */
export async function deleteServicePhoto({ serviceId, photoId, employeeId = null, isAdmin = false, db = defaultDb }) {
  const photo = await db.servicePhoto.findUnique({
    where: { id: photoId },
    include: { service: { select: { employeeId: true, status: true } } },
  });
  if (!photo || photo.serviceId !== serviceId) throw new JobClaimError(404, 'PHOTO_NOT_FOUND', 'Photo not found');
  if (!isAdmin) {
    if (photo.service.employeeId !== employeeId) throw new JobClaimError(403, 'NOT_ASSIGNED', 'This job is not assigned to you');
    if (photo.service.status !== 'IN_PROGRESS') {
      throw new JobClaimError(409, 'JOB_NOT_ACTIVE', 'Photos can only be removed while the job is in progress');
    }
  }
  await db.servicePhoto.delete({ where: { id: photoId } });
  if (photo.s3Key) {
    await storage.deleteFromS3(photo.s3Key).catch((err) => console.error('Failed to delete photo object', photo.s3Key, err));
  }
  return { deleted: true, id: photoId };
}

/**
 * Shared POST handler for the scooper photo routes. Accepts either
 * multipart/form-data (`file` or `photo`, plus `type` or `category`) or JSON
 * `{ key, type }` to confirm a direct upload made with an upload URL.
 */
export async function handlePhotoUploadRequest(request, serviceId) {
  try {
    const auth = await requireScooper(request);
    if (!auth.ok) return auth.response;
    const contentType = request.headers.get('content-type') || '';
    let photo;
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      photo = await uploadPhotoFile({
        serviceId: serviceId || form.get('serviceId'),
        employeeId: auth.employee.id,
        file: form.get('file') || form.get('photo'),
        type: form.get('type') || form.get('category'),
      });
    } else {
      const body = await request.json().catch(() => ({}));
      photo = await confirmPhotoUpload({
        serviceId: serviceId || body?.serviceId,
        employeeId: auth.employee.id,
        key: body?.key,
        type: body?.type,
      });
    }
    return NextResponse.json({ success: true, photo }, { status: 201, headers: NO_STORE });
  } catch (error) {
    return jobClaimErrorResponse(error, 'Failed to upload photo');
  }
}

export async function handlePhotoUploadUrlRequest(request, serviceId) {
  try {
    const auth = await requireScooper(request);
    if (!auth.ok) return auth.response;
    const body = await request.json().catch(() => ({}));
    const upload = await createPhotoUploadUrl({
      serviceId,
      employeeId: auth.employee.id,
      type: body?.type,
      contentType: body?.contentType,
      size: body?.size,
    });
    return NextResponse.json(upload, { headers: NO_STORE });
  } catch (error) {
    return jobClaimErrorResponse(error, 'Failed to create upload URL');
  }
}

export async function handlePhotoListRequest(request, serviceId) {
  try {
    const viewer = await authorizePhotoViewer(request, serviceId);
    if (!viewer.ok) return viewer.response;
    const photos = await listServicePhotos({ serviceId });
    return NextResponse.json(
      { success: true, serviceId, photos, byType: groupPhotosByType(photos) },
      { headers: NO_STORE }
    );
  } catch (error) {
    return jobClaimErrorResponse(error, 'Failed to fetch photos');
  }
}

export async function handlePhotoDeleteRequest(request, serviceId) {
  try {
    const viewer = await authorizePhotoViewer(request, serviceId);
    if (!viewer.ok) return viewer.response;
    if (viewer.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Customers cannot delete job photos' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const result = await deleteServicePhoto({
      serviceId,
      photoId: body?.photoId || searchParams.get('photoId'),
      employeeId: viewer.employeeId,
      isAdmin: viewer.role === 'ADMIN',
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return jobClaimErrorResponse(error, 'Failed to delete photo');
  }
}
