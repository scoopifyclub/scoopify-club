import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma as defaultDb } from '@/lib/prisma';
import { JobClaimError, jobClaimErrorResponse, requireScooper } from '@/lib/job-claims';
import { buildFinancialRecord } from '@/lib/job-financials';
import { useServiceCredit } from '@/lib/service-credits';
import {
  toPhotoView,
  isStoredPhoto,
  PHOTO_CONTENT_TYPES,
  PHOTO_RETENTION_DAYS,
  PHOTO_RETENTION_MS,
} from '@/lib/service-photos';
import * as storage from '@/lib/s3';

// Pilot: one after/cleanup photo is enough. Before photos stay optional.
export const REQUIRED_PHOTOS = { AFTER: 1 };
export const REQUIRED_CHECKLIST_ITEMS = ['allWasteRemoved', 'gateClosed'];
// Signed URLs in the customer email; SigV4 presigned URLs cannot outlive 7 days.
export const EMAIL_PHOTO_URL_TTL_SECONDS = PHOTO_RETENTION_DAYS * 24 * 60 * 60;

// Older completion screens use different names for the same checklist items.
const CHECKLIST_ALIASES = {
  yardCleaned: 'allWasteRemoved',
  wasteRemoved: 'allWasteRemoved',
  wasteDisposed: 'allWasteRemoved',
  gateClosedOnExit: 'gateClosed',
  gatesClosed: 'gateClosed',
  gatesSecured: 'gateClosed',
};

/**
 * Checklist as `{ item: true|false }`. Accepts an object of booleans, an
 * array of checked item names, an array of `{ id|key|item|text, completed|checked }`,
 * or a JSON string of any of those.
 */
export function normalizeChecklist(input) {
  let value = input;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return {};
    }
  }
  const items = {};
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry === 'string') items[entry] = true;
      else if (entry && typeof entry === 'object') {
        const name = entry.id ?? entry.key ?? entry.item ?? entry.text;
        if (name) items[name] = entry.completed === true || entry.checked === true;
      }
    }
  } else if (value && typeof value === 'object') {
    for (const [name, checked] of Object.entries(value)) items[name] = checked === true;
  }
  for (const [alias, canonical] of Object.entries(CHECKLIST_ALIASES)) {
    if (items[alias] === true) items[canonical] = true;
  }
  return items;
}

export function missingChecklistItems(items) {
  return REQUIRED_CHECKLIST_ITEMS.filter((name) => items[name] !== true);
}

async function logSystemEvent(db, type, message, data) {
  try {
    await db.systemLog.create({ data: { type, message, data } });
  } catch (error) {
    console.error(`Failed to write ${type} system log:`, error);
  }
}

const COMPLETION_SELECT = {
  id: true,
  status: true,
  workflowStatus: true,
  scheduledDate: true,
  claimedAt: true,
  arrivedAt: true,
  completedDate: true,
  checklistCompleted: true,
  employeeId: true,
  customerId: true,
  checklist: { select: { items: true, notes: true, completedAt: true } },
};

/** The completion record for a job: status, timestamps, checklist, earning, photo counts. */
export async function getCompletionSummary({ serviceId, db = defaultDb }) {
  const [service, earning, financialRecord, photoCounts] = await Promise.all([
    db.service.findUnique({ where: { id: serviceId }, select: COMPLETION_SELECT }),
    db.earning.findUnique({ where: { serviceId } }),
    db.jobFinancialRecord.findUnique({ where: { serviceId } }),
    db.servicePhoto.groupBy({ by: ['type'], where: { serviceId }, _count: { _all: true } }),
  ]);
  if (!service) throw new JobClaimError(404, 'JOB_NOT_FOUND', 'Job not found');
  return {
    service,
    earning: earning && { id: earning.id, amount: earning.amount, status: earning.status, createdAt: earning.createdAt },
    financialRecord,
    photoCounts: Object.fromEntries(photoCounts.map((row) => [row.type, row._count._all])),
  };
}

function extensionForContentType(contentType) {
  return PHOTO_CONTENT_TYPES[contentType] || 'jpg';
}

function dataUrlAttachment(photo, index) {
  const match = String(photo.url || '').match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return {
    filename: `cleanup-${index + 1}.${extensionForContentType(match[1])}`,
    content: Buffer.from(match[2], 'base64'),
    contentType: match[1],
  };
}

async function s3Attachment(photo, index) {
  if (!photo.s3Key || !storage.isStorageConfigured()) return null;
  try {
    const { body, contentType } = await storage.getObjectBytes(photo.s3Key);
    const type = contentType || photo.contentType || 'image/jpeg';
    return {
      filename: `cleanup-${index + 1}.${extensionForContentType(type)}`,
      content: body,
      contentType: type,
    };
  } catch (error) {
    console.warn('Failed to load photo for email attachment', photo.s3Key, error);
    return null;
  }
}

async function buildPhotoAttachments(photos) {
  const attachments = [];
  let index = 0;
  for (const photo of photos) {
    if (photo.type !== 'AFTER') continue;
    const attachment = dataUrlAttachment(photo, index) || (await s3Attachment(photo, index));
    if (attachment) {
      attachments.push(attachment);
      index += 1;
    }
  }
  return attachments;
}

function adminNotificationEmail() {
  if (process.env.ADMIN_EMAIL) return process.env.ADMIN_EMAIL.trim();
  const list = String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return list[0] || null;
}

/**
 * Emails the customer that the job is done, with the cleanup photo attached
 * (and signed links when S3 is configured). Optionally CC's the admin.
 * Never throws: a missing SMTP configuration or a send failure is logged and
 * reported in the result.
 */
export async function sendCompletionEmail({ serviceId, db = defaultDb, now = new Date() }) {
  let result;
  try {
    const service = await db.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        completedDate: true,
        servicePlan: { select: { name: true } },
        customer: { select: { user: { select: { email: true, firstName: true, lastName: true } } } },
        employee: { select: { user: { select: { firstName: true, lastName: true, image: true } } } },
        photos: { where: { type: { in: ['BEFORE', 'AFTER'] } }, orderBy: { createdAt: 'asc' } },
      },
    });
    const stored = (service.photos || []).filter(isStoredPhoto);
    const photos = await Promise.all(
      stored.map((photo) => toPhotoView(photo, { ttlSeconds: EMAIL_PHOTO_URL_TTL_SECONDS, now }))
    );
    const attachments = await buildPhotoAttachments(stored);
    const { sendServiceCompletedEmail } = await import('@/lib/unified-email-service');
    result = await sendServiceCompletedEmail(service, service.employee, {
      photos,
      attachments,
      cc: adminNotificationEmail() || undefined,
    });
  } catch (error) {
    result = { success: false, error: error.message };
  }
  const outcome = result?.success ? 'sent' : result?.skipped ? 'skipped' : 'failed';
  await logSystemEvent(db, 'SERVICE_COMPLETION_EMAIL', `Completion email for service ${serviceId} ${outcome}`, {
    serviceId,
    outcome,
    reason: result?.reason ?? result?.error ?? null,
    at: now,
  });
  return { sent: outcome === 'sent', outcome, reason: result?.reason ?? result?.error ?? null };
}

/**
 * Completes a checked-in job for its assigned scooper.
 * Requires every REQUIRED_CHECKLIST_ITEMS entry (from the request or the
 * checklist saved earlier) and REQUIRED_PHOTOS uploaded to storage. In one
 * transaction the status moves IN_PROGRESS -> COMPLETED with a conditional
 * update, so only one request can complete a job; that request records the
 * checklist, the job's JobFinancialRecord and the matching Earning (both
 * unique per job), uses the visit's service credit unless booking already
 * did, and later sends the customer email. Repeating the call returns the existing completion with
 * alreadyCompleted: true and changes nothing. COMPLETED is not an active
 * status, so the scooper can claim their next job right away.
 */
export async function completeService({ serviceId, employeeId, checklist, notes, now = new Date(), db = defaultDb }) {
  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: {
      ...COMPLETION_SELECT,
      subscriptionId: true,
      servicePlanId: true,
      servicePlan: { select: { id: true, price: true, type: true } },
      subscription: { select: { servicePlan: { select: { id: true, price: true, type: true } } } },
      photos: { select: { id: true, type: true, s3Key: true, url: true } },
    },
  });
  if (!service) throw new JobClaimError(404, 'JOB_NOT_FOUND', 'Job not found');
  if (service.employeeId !== employeeId) throw new JobClaimError(403, 'NOT_ASSIGNED', 'This job is not assigned to you');
  if (service.status === 'COMPLETED') {
    return { alreadyCompleted: true, ...(await getCompletionSummary({ serviceId, db })) };
  }
  if (service.status === 'PENDING') {
    throw new JobClaimError(409, 'NOT_CHECKED_IN', 'Check in to the job before completing it');
  }
  if (service.status !== 'IN_PROGRESS') {
    throw new JobClaimError(409, 'INVALID_STATUS', `Job cannot be completed from status ${service.status}`);
  }

  const items = { ...normalizeChecklist(service.checklist?.items), ...normalizeChecklist(checklist) };
  const missingItems = missingChecklistItems(items);
  if (missingItems.length > 0) {
    throw new JobClaimError(400, 'CHECKLIST_INCOMPLETE', 'Complete the checklist before finishing the job', { missingItems });
  }

  const uploaded = { BEFORE: [], AFTER: [] };
  for (const photo of service.photos) {
    if (!isStoredPhoto(photo)) continue;
    uploaded[photo.type]?.push(photo.id);
  }
  const missingPhotos = Object.entries(REQUIRED_PHOTOS)
    .filter(([type, required]) => uploaded[type].length < required)
    .map(([type, required]) => ({ type, required, uploaded: uploaded[type].length }));
  if (missingPhotos.length > 0) {
    throw new JobClaimError(400, 'PHOTOS_REQUIRED', 'Upload one after/cleanup photo first', { missingPhotos });
  }

  const financial = buildFinancialRecord({ service, completedAt: now });
  const scooperNotes = typeof notes === 'string' && notes.trim() ? notes.trim().slice(0, 2000) : undefined;
  let completedNow = false;
  let creditResult = null;

  await db.$transaction(async (tx) => {
    const { count } = await tx.service.updateMany({
      where: { id: serviceId, employeeId, status: 'IN_PROGRESS' },
      data: {
        status: 'COMPLETED',
        workflowStatus: 'COMPLETED',
        completedDate: now,
        checklistCompleted: true,
        beforePhotoIds: uploaded.BEFORE,
        afterPhotoIds: uploaded.AFTER,
        updatedAt: now,
      },
    });
    if (count !== 1) return;
    completedNow = true;

    await tx.serviceChecklist.upsert({
      where: { serviceId },
      create: { id: randomUUID(), serviceId, items, notes: scooperNotes, completedAt: now, updatedAt: now },
      update: { items, completedAt: now, updatedAt: now, ...(scooperNotes && { notes: scooperNotes }) },
    });
    if (financial) {
      await tx.jobFinancialRecord.create({ data: financial });
      await tx.earning.create({
        data: {
          id: randomUUID(),
          amount: financial.scooperEarningCents / 100,
          status: 'PENDING',
          serviceId,
          employeeId,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
    await tx.employee.update({ where: { id: employeeId }, data: { completedJobs: { increment: 1 }, updatedAt: now } });

    // Hold photos ~7 days, then /api/cron/cleanup-photos purges them.
    await tx.cleanupTask.create({
      data: {
        id: randomUUID(),
        taskType: 'PHOTO_CLEANUP',
        status: 'PENDING',
        scheduledFor: new Date(now.getTime() + PHOTO_RETENTION_MS),
        targetId: serviceId,
        updatedAt: now,
      },
    });

    creditResult = await useServiceCredit(tx, { serviceId, customerId: service.customerId, now });
  }, { maxWait: 10000, timeout: 15000 });

  if (!completedNow) {
    const current = await db.service.findUnique({ where: { id: serviceId }, select: { status: true, employeeId: true } });
    if (current?.status === 'COMPLETED' && current.employeeId === employeeId) {
      return { alreadyCompleted: true, ...(await getCompletionSummary({ serviceId, db })) };
    }
    throw new JobClaimError(409, 'JOB_STATE_CHANGED', 'This job changed before it could be completed. Refresh and try again.');
  }

  if (creditResult === 'NO_CREDIT') {
    await logSystemEvent(db, 'SERVICE_CREDIT_UNAVAILABLE', `Service ${serviceId} completed with no service credit left`, {
      serviceId,
      customerId: service.customerId,
    });
  }
  if (!financial) {
    await logSystemEvent(db, 'EARNING_AMOUNT_MISSING', `No financial record for service ${serviceId}: plan has no price`, {
      serviceId,
      employeeId,
    });
  }

  const customer = await db.customer.findUnique({ where: { id: service.customerId }, select: { userId: true } });
  try {
    await db.notification.create({
      data: {
        id: randomUUID(),
        userId: customer.userId,
        type: 'SERVICE_COMPLETED',
        title: 'Your service is complete',
        message: 'Your scooper finished your service. A cleanup photo is in your email and dashboard.',
        metadata: { serviceId, completedAt: now },
      },
    });
  } catch (error) {
    console.warn('Failed to create completion notification:', error);
  }

  const email = await sendCompletionEmail({ serviceId, db, now });
  return { alreadyCompleted: false, ...(await getCompletionSummary({ serviceId, db })), email };
}

/** Shared POST handler for the scooper completion routes. */
export async function handleCompleteRequest(request, serviceId, body = undefined) {
  try {
    const auth = await requireScooper(request);
    if (!auth.ok) return auth.response;
    const payload = body ?? (await request.json().catch(() => ({})));
    const result = await completeService({
      serviceId: serviceId || payload?.serviceId,
      employeeId: auth.employee.id,
      checklist: payload?.checklist ?? payload?.checklistItems,
      notes: payload?.notes,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return jobClaimErrorResponse(error, 'Failed to complete service');
  }
}

/** Saves checklist progress for the assigned scooper before completion. */
export async function saveChecklist({ serviceId, employeeId, checklist, notes, now = new Date(), db = defaultDb }) {
  const service = await db.service.findUnique({ where: { id: serviceId }, select: { employeeId: true, status: true } });
  if (!service) throw new JobClaimError(404, 'JOB_NOT_FOUND', 'Job not found');
  if (service.employeeId !== employeeId) throw new JobClaimError(403, 'NOT_ASSIGNED', 'This job is not assigned to you');
  if (service.status !== 'IN_PROGRESS') {
    throw new JobClaimError(409, 'JOB_NOT_ACTIVE', 'The checklist can only be changed while the job is in progress');
  }
  const items = normalizeChecklist(checklist);
  const scooperNotes = typeof notes === 'string' ? notes.trim().slice(0, 2000) : undefined;
  return db.serviceChecklist.upsert({
    where: { serviceId },
    create: { id: randomUUID(), serviceId, items, notes: scooperNotes || null, updatedAt: now },
    update: { items, updatedAt: now, ...(scooperNotes !== undefined && { notes: scooperNotes || null }) },
  });
}

/** Everything an admin needs to review a completed job. Photo URLs are signed and short-lived. */
export async function getCompletionEvidence({ serviceId, db = defaultDb }) {
  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: {
      ...COMPLETION_SELECT,
      servicePlan: { select: { name: true, price: true, type: true } },
      customer: {
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true, email: true } },
          address: { select: { street: true, city: true, state: true, zipCode: true } },
        },
      },
      employee: { select: { id: true, user: { select: { firstName: true, lastName: true, email: true } } } },
      photos: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!service) throw new JobClaimError(404, 'JOB_NOT_FOUND', 'Job not found');
  const [earning, financialRecord, emailLog, photos] = await Promise.all([
    db.earning.findUnique({ where: { serviceId } }),
    db.jobFinancialRecord.findUnique({ where: { serviceId } }),
    db.systemLog.findMany({
      where: { type: 'SERVICE_COMPLETION_EMAIL', data: { path: ['serviceId'], equals: serviceId } },
      orderBy: { createdAt: 'desc' },
      select: { message: true, data: true, createdAt: true },
    }),
    Promise.all(service.photos.map((photo) => toPhotoView(photo))),
  ]);
  return { service: { ...service, photos: undefined }, photos, earning, financialRecord, emailLog };
}
