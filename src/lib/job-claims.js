import { NextResponse } from 'next/server';
import { prisma as defaultDb } from '@/lib/prisma';
import { validateUserToken } from '@/lib/jwt-utils';

export const CLAIM_WINDOW_MINUTES = 45;
export const CLAIM_WINDOW_MS = CLAIM_WINDOW_MINUTES * 60 * 1000;
// A claimed job is PENDING until the scooper checks in, then IN_PROGRESS.
// The partial unique index Service_one_active_job_per_employee uses the same set.
export const ACTIVE_JOB_STATUSES = ['PENDING', 'IN_PROGRESS'];
export const ARRIVAL_RADIUS_MILES = 0.25;

export const BUSINESS_TIME_ZONE = 'America/Denver';
export const JOB_VIEW_OPEN_HOUR = 8;
export const JOB_VIEW_CLOSE_HOUR = 19;

function zonedParts(date, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(date)
      .map((p) => [p.type, Number(p.value)])
  );
  return parts;
}

/**
 * The daily window (8:00 AM to 7:00 PM America/Denver) in which scoopers can
 * browse jobs, independent of the server's time zone. opensAt/closesAt are
 * the UTC instants of today's (Denver date) window edges.
 */
export function getJobViewingWindow(now = new Date(), timeZone = BUSINESS_TIME_ZONE) {
  const p = zonedParts(now, timeZone);
  const wallAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const offsetMs = wallAsUtc - Math.floor(now.getTime() / 1000) * 1000;
  const at = (hour) => new Date(Date.UTC(p.year, p.month - 1, p.day, hour) - offsetMs);
  const opensAt = at(JOB_VIEW_OPEN_HOUR);
  const closesAt = at(JOB_VIEW_CLOSE_HOUR);
  return { isOpen: now >= opensAt && now <= closesAt, opensAt, closesAt, timeZone };
}

export class JobClaimError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.name = 'JobClaimError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function jobClaimErrorResponse(error, fallbackMessage = 'Request failed') {
  if (error instanceof JobClaimError) {
    return NextResponse.json(
      { error: error.message, code: error.code, ...(error.details || {}) },
      { status: error.status }
    );
  }
  console.error(fallbackMessage, error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

export function isApprovedScooper(employee) {
  return Boolean(employee && employee.status === 'ACTIVE' && employee.approvedAt);
}

async function getRequestToken(request) {
  const header = request?.headers?.get?.('authorization');
  if (header && header.toLowerCase().startsWith('bearer ')) {
    const bearer = header.slice(7).trim();
    if (bearer && bearer !== 'null' && bearer !== 'undefined') return bearer;
  }
  let cookieStore = request?.cookies;
  if (!cookieStore?.get) {
    try {
      const { cookies } = await import('next/headers');
      cookieStore = await cookies();
    } catch {
      return null;
    }
  }
  return cookieStore.get('accessToken')?.value || cookieStore.get('token')?.value || null;
}

/**
 * Authenticates a scooper from the Bearer header or the accessToken cookie
 * (the scooper app uses both) and loads their Employee row.
 * Unless requireApproval is false, the scooper must be ACTIVE and approved
 * by an admin.
 */
export async function requireScooper(request, { requireApproval = true, db = defaultDb } = {}) {
  const token = await getRequestToken(request);
  const decoded = token ? await validateUserToken(token, 'EMPLOYEE') : null;
  if (!decoded?.userId) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const employee = await db.employee.findUnique({ where: { userId: decoded.userId } });
  if (!employee) {
    return { ok: false, response: NextResponse.json({ error: 'Employee profile not found' }, { status: 404 }) };
  }
  if (requireApproval && !isApprovedScooper(employee)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'Your scooper account is waiting for admin approval. You can claim jobs once it is approved.',
          code: 'SCOOPER_NOT_APPROVED',
        },
        { status: 403 }
      ),
    };
  }
  return { ok: true, employee, userId: decoded.userId };
}

function claimDeadline(service) {
  if (service.arrivalDeadline) return new Date(service.arrivalDeadline);
  if (service.claimedAt) return new Date(new Date(service.claimedAt).getTime() + CLAIM_WINDOW_MS);
  return null;
}

async function logSystemEvent(db, type, message, data) {
  try {
    await db.systemLog.create({ data: { type, message, data } });
  } catch (error) {
    console.error(`Failed to write ${type} system log:`, error);
  }
}

/**
 * Requeues jobs whose scooper claimed them but did not check in within
 * CLAIM_WINDOW_MINUTES. Each release is a conditional update, so a check-in
 * that lands first wins and the job is left alone.
 */
export async function releaseExpiredClaims({ now = new Date(), db = defaultDb } = {}) {
  const legacyCutoff = new Date(now.getTime() - CLAIM_WINDOW_MS);
  const candidates = await db.service.findMany({
    where: {
      status: 'PENDING',
      employeeId: { not: null },
      arrivedAt: null,
      OR: [
        { arrivalDeadline: { lt: now } },
        { arrivalDeadline: null, claimedAt: { lt: legacyCutoff } },
      ],
    },
    select: { id: true, employeeId: true, claimedAt: true, arrivalDeadline: true },
  });

  const released = [];
  for (const service of candidates) {
    const { count } = await db.service.updateMany({
      where: {
        id: service.id,
        employeeId: service.employeeId,
        status: 'PENDING',
        arrivedAt: null,
        claimedAt: service.claimedAt,
      },
      data: {
        employeeId: null,
        status: 'SCHEDULED',
        workflowStatus: 'AVAILABLE',
        claimedAt: null,
        arrivalDeadline: null,
        updatedAt: now,
      },
    });
    if (count === 1) {
      released.push(service);
      await logSystemEvent(db, 'JOB_CLAIM_EXPIRED', `Claim on service ${service.id} expired without check-in; job requeued`, {
        serviceId: service.id,
        employeeId: service.employeeId,
        claimedAt: service.claimedAt,
        arrivalDeadline: claimDeadline(service),
        releasedAt: now,
      });
    }
  }
  return { released: released.length, serviceIds: released.map((s) => s.id) };
}

/**
 * Moves unclaimed jobs whose date has passed onto today (same time of day),
 * keeping the same row so nothing is duplicated.
 */
export async function requeueOverdueUnclaimed({ now = new Date(), db = defaultDb } = {}) {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const overdue = await db.service.findMany({
    where: { status: 'SCHEDULED', employeeId: null, scheduledDate: { lt: startOfToday } },
    select: { id: true, scheduledDate: true, customer: { select: { userId: true } } },
  });

  const requeued = [];
  for (const service of overdue) {
    const newDate = new Date(startOfToday);
    newDate.setHours(service.scheduledDate.getHours(), service.scheduledDate.getMinutes(), 0, 0);
    const { count } = await db.service.updateMany({
      where: { id: service.id, status: 'SCHEDULED', employeeId: null, scheduledDate: service.scheduledDate },
      data: { scheduledDate: newDate, workflowStatus: 'AVAILABLE', updatedAt: now },
    });
    if (count === 1) {
      requeued.push({ ...service, newDate });
    }
  }
  return { requeued: requeued.length, services: requeued };
}

async function assertInServiceArea(tx, employeeId, serviceId) {
  const [areas, service] = await Promise.all([
    tx.coverageArea.findMany({ where: { employeeId, active: true }, select: { zipCode: true } }),
    tx.service.findUnique({
      where: { id: serviceId },
      select: { id: true, customer: { select: { address: { select: { zipCode: true } } } } },
    }),
  ]);
  if (!service) {
    throw new JobClaimError(404, 'JOB_NOT_FOUND', 'Job not found');
  }
  const zip = service.customer?.address?.zipCode;
  if (areas.length === 0) {
    throw new JobClaimError(400, 'NO_SERVICE_AREA', 'You must set your service area before claiming jobs');
  }
  if (!zip || !areas.some((area) => area.zipCode === zip)) {
    throw new JobClaimError(400, 'OUTSIDE_SERVICE_AREA', 'Job is not in your service area');
  }
}

function isUniqueViolation(error) {
  return error?.code === 'P2002' || /Service_one_active_job_per_employee|23505/.test(String(error?.message));
}

/**
 * Atomically assigns an unclaimed job to an approved scooper.
 * - The Employee row is locked FOR UPDATE, so one scooper's claims run one
 *   at a time and the one-active-job check cannot be raced.
 * - The job is taken with a conditional update (employeeId IS NULL and
 *   status SCHEDULED); only one concurrent claim can match it.
 * - The partial unique index on Service(employeeId) backs this up for any
 *   other code path that assigns jobs.
 */
export async function claimService({ serviceId, employeeId, now = new Date(), db = defaultDb }) {
  if (!serviceId) {
    throw new JobClaimError(400, 'JOB_ID_REQUIRED', 'Job ID is required');
  }
  await releaseExpiredClaims({ now, db });

  try {
    await db.$transaction(async (tx) => {
      const [locked] = await tx.$queryRaw`
        SELECT "id", "status"::text AS "status", "approvedAt"
        FROM "Employee" WHERE "id" = ${employeeId} FOR UPDATE`;
      if (!locked) {
        throw new JobClaimError(404, 'EMPLOYEE_NOT_FOUND', 'Employee profile not found');
      }
      if (!isApprovedScooper(locked)) {
        throw new JobClaimError(
          403,
          'SCOOPER_NOT_APPROVED',
          'Your scooper account is waiting for admin approval. You can claim jobs once it is approved.'
        );
      }

      const active = await tx.service.findFirst({
        where: { employeeId, status: { in: ACTIVE_JOB_STATUSES } },
        select: { id: true },
      });
      if (active) {
        throw new JobClaimError(
          409,
          'ACTIVE_JOB_EXISTS',
          'You already have an active job. Check in and complete it before claiming another.',
          { activeServiceId: active.id }
        );
      }

      await assertInServiceArea(tx, employeeId, serviceId);

      const { count } = await tx.service.updateMany({
        where: { id: serviceId, employeeId: null, status: 'SCHEDULED' },
        data: {
          employeeId,
          status: 'PENDING',
          workflowStatus: 'CLAIMED',
          claimedAt: now,
          arrivalDeadline: new Date(now.getTime() + CLAIM_WINDOW_MS),
          arrivedAt: null,
          updatedAt: now,
        },
      });
      if (count !== 1) {
        throw new JobClaimError(409, 'JOB_ALREADY_CLAIMED', 'This job has already been claimed or is no longer available');
      }
    }, { maxWait: 10000, timeout: 15000 });
  } catch (error) {
    if (error instanceof JobClaimError) throw error;
    if (isUniqueViolation(error)) {
      throw new JobClaimError(
        409,
        'ACTIVE_JOB_EXISTS',
        'You already have an active job. Check in and complete it before claiming another.'
      );
    }
    throw error;
  }

  return getAssignedJob({ serviceId, employeeId, db, reason: 'claim' });
}

const ASSIGNED_JOB_SELECT = {
  id: true,
  status: true,
  workflowStatus: true,
  scheduledDate: true,
  claimedAt: true,
  arrivalDeadline: true,
  arrivedAt: true,
  potentialEarnings: true,
  notes: true,
  employeeId: true,
  customerId: true,
  servicePlan: { select: { name: true, price: true, duration: true } },
  location: { select: { latitude: true, longitude: true, address: true } },
  photos: { select: { id: true, url: true, type: true, createdAt: true } },
  checklist: { select: { items: true, completedAt: true, notes: true } },
  customer: {
    select: {
      userId: true,
      gateCode: true,
      phone: true,
      address: { select: { street: true, city: true, state: true, zipCode: true } },
      user: { select: { firstName: true, lastName: true } },
    },
  },
  employee: {
    select: { id: true, user: { select: { firstName: true, lastName: true, image: true } } },
  },
};

function toAssignedJobView(service) {
  const { customer, ...rest } = service;
  const customerName = [customer?.user?.firstName, customer?.user?.lastName].filter(Boolean).join(' ');
  return {
    ...rest,
    claimExpiresAt: claimDeadline(service),
    gateCode: customer?.gateCode ?? null,
    customer: {
      name: customerName || null,
      phone: customer?.phone ?? null,
      gateCode: customer?.gateCode ?? null,
      address: customer?.address ?? null,
    },
  };
}

/**
 * Returns a job with its access details (gate code, street address, phone,
 * notes) for the scooper currently assigned to it, and records the reveal.
 * Anyone else gets 403.
 */
export async function getAssignedJob({ serviceId, employeeId, db = defaultDb, reason = 'view', now = new Date() }) {
  const service = await db.service.findUnique({ where: { id: serviceId }, select: ASSIGNED_JOB_SELECT });
  if (!service) {
    throw new JobClaimError(404, 'JOB_NOT_FOUND', 'Job not found');
  }
  if (service.employeeId !== employeeId || !ACTIVE_JOB_STATUSES.includes(service.status)) {
    throw new JobClaimError(403, 'NOT_ASSIGNED', 'This job is not assigned to you');
  }
  const deadline = claimDeadline(service);
  if (service.status === 'PENDING' && !service.arrivedAt && deadline && now > deadline) {
    await releaseExpiredClaims({ now, db });
    throw new JobClaimError(403, 'CLAIM_EXPIRED', 'Your claim expired before check-in and the job was released');
  }
  if (service.customer?.gateCode) {
    await logSystemEvent(db, 'GATE_CODE_REVEALED', `Gate code for service ${service.id} shown to assigned scooper`, {
      serviceId: service.id,
      employeeId,
      reason,
    });
  }
  return toAssignedJobView(service);
}

function distanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Records the assigned scooper's arrival. It must happen before the claim's
 * arrival deadline; a late check-in releases the job and returns 403. When
 * the job has a geocoded Location, the scooper's coordinates must be within
 * ARRIVAL_RADIUS_MILES of it.
 */
export async function checkInService({ serviceId, employeeId, latitude, longitude, now = new Date(), db = defaultDb }) {
  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: {
      id: true,
      employeeId: true,
      status: true,
      claimedAt: true,
      arrivalDeadline: true,
      arrivedAt: true,
      location: { select: { latitude: true, longitude: true } },
      customer: { select: { userId: true } },
    },
  });
  if (!service) {
    throw new JobClaimError(404, 'JOB_NOT_FOUND', 'Job not found');
  }
  if (service.employeeId !== employeeId) {
    throw new JobClaimError(403, 'NOT_ASSIGNED', 'This job is not assigned to you');
  }
  if (service.arrivedAt || service.status === 'IN_PROGRESS') {
    throw new JobClaimError(409, 'ALREADY_CHECKED_IN', 'You have already checked in to this job');
  }
  if (service.status !== 'PENDING') {
    throw new JobClaimError(409, 'INVALID_STATUS', `Job cannot be checked in from status ${service.status}`);
  }
  const deadline = claimDeadline(service);
  if (deadline && now > deadline) {
    await releaseExpiredClaims({ now, db });
    throw new JobClaimError(403, 'CLAIM_EXPIRED', 'Your claim expired before check-in and the job was released');
  }

  if (service.location) {
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (latitude == null || longitude == null || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new JobClaimError(400, 'LOCATION_REQUIRED', 'Your current location is required to check in');
    }
    const distance = distanceMiles(lat, lon, service.location.latitude, service.location.longitude);
    if (distance > ARRIVAL_RADIUS_MILES) {
      throw new JobClaimError(403, 'TOO_FAR', 'You must be at the service location to check in', {
        distanceMiles: Math.round(distance * 100) / 100,
      });
    }
  }

  const { count } = await db.service.updateMany({
    where: {
      id: serviceId,
      employeeId,
      status: 'PENDING',
      arrivedAt: null,
      OR: [{ arrivalDeadline: null }, { arrivalDeadline: { gte: now } }],
    },
    data: { status: 'IN_PROGRESS', workflowStatus: 'ARRIVED', arrivedAt: now, updatedAt: now },
  });
  if (count !== 1) {
    throw new JobClaimError(409, 'JOB_STATE_CHANGED', 'This job changed before check-in completed. Refresh and try again.');
  }

  try {
    await db.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: service.customer.userId,
        type: 'SERVICE_STARTED',
        title: 'Your scooper has arrived',
        message: 'Your scooper has arrived and started your service.',
        metadata: { serviceId, employeeId, arrivedAt: now },
      },
    });
  } catch (error) {
    console.warn('Failed to create arrival notification:', error);
  }

  return getAssignedJob({ serviceId, employeeId, db, reason: 'check-in', now });
}

/** Shared POST handler for the scooper check-in/arrive routes. */
export async function handleCheckInRequest(request, serviceId) {
  try {
    const auth = await requireScooper(request);
    if (!auth.ok) return auth.response;
    const body = await request.json().catch(() => ({}));
    const service = await checkInService({
      serviceId,
      employeeId: auth.employee.id,
      latitude: body?.latitude,
      longitude: body?.longitude,
    });
    return NextResponse.json(service);
  } catch (error) {
    return jobClaimErrorResponse(error, 'Failed to check in to service');
  }
}

/**
 * Prisma select for the customer on unclaimed-job feeds: no gate code,
 * street, phone, email, or notes until the job is claimed.
 */
export const UNCLAIMED_JOB_CUSTOMER_SELECT = {
  select: {
    user: { select: { firstName: true } },
    address: { select: { city: true, state: true, zipCode: true } },
  },
};

export function toUnclaimedCustomerView(customer) {
  return {
    name: customer?.user?.firstName || 'Customer',
    address: {
      city: customer?.address?.city ?? null,
      state: customer?.address?.state ?? null,
      zipCode: customer?.address?.zipCode ?? null,
    },
  };
}
