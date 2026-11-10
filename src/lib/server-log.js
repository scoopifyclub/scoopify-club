/**
 * Durable server logging into the SystemLog table, used by src/instrumentation.js
 * (`onRequestError`) and available to routes that want to record a handled error.
 *
 * Contract: these functions never throw and never hold a request for longer than
 * SERVER_LOG_TIMEOUT_MS. When the database is slow or down, logging is skipped
 * (fail open) and the request carries on.
 *
 * Environment (all optional):
 *   SERVER_LOG_DB=off                  disable database writes
 *   SERVER_LOG_TIMEOUT_MS=1500         max time a request waits on a log write
 *   SERVER_LOG_MAX_PER_MINUTE=30       per-instance cap, protects Neon storage in an error storm
 *   SYSTEM_LOG_RETENTION_DAYS=30       SERVER_* rows older than this are pruned
 *   SERVER_LOG_PRUNE_INTERVAL_HOURS=6  how often an instance runs the prune check
 */
import { randomUUID } from 'node:crypto';
import {
  LIMITS,
  redactText,
  sanitize,
  sanitizePath,
  sanitizeRequestId,
  truncate,
} from './log-redaction.js';

export const LOG_TYPES = {
  error: 'SERVER_ERROR',
  warn: 'SERVER_WARN',
  info: 'SERVER_INFO',
};
const TYPE_PREFIX = 'SERVER_';
const FAILURE_COOLDOWN_MS = 60_000;

const state = {
  windowStart: 0,
  windowCount: 0,
  disabledUntil: 0,
  lastPruneAt: 0,
  droppedSinceLastWrite: 0,
};

let prismaOverride;
let prismaPromise;

function intEnv(name, fallback, min = 0) {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(parsed) && parsed >= min ? parsed : fallback;
}

export function getConfig() {
  return {
    enabled: !/^(off|false|0|no)$/i.test(process.env.SERVER_LOG_DB ?? ''),
    timeoutMs: intEnv('SERVER_LOG_TIMEOUT_MS', 1500, 50),
    maxPerMinute: intEnv('SERVER_LOG_MAX_PER_MINUTE', 30, 1),
    retentionDays: intEnv('SYSTEM_LOG_RETENTION_DAYS', 30, 1),
    pruneIntervalMs: intEnv('SERVER_LOG_PRUNE_INTERVAL_HOURS', 6, 1) * 3_600_000,
  };
}

async function getPrisma() {
  if (prismaOverride !== undefined) return prismaOverride;
  if (!prismaPromise) {
    prismaPromise = import('./prisma.js').then((mod) => mod.prisma ?? mod.default ?? null);
  }
  return prismaPromise;
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve('timeout'), ms);
    timer.unref?.();
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function readHeader(headers, name) {
  if (!headers) return undefined;
  try {
    if (typeof headers.get === 'function') return headers.get(name) ?? undefined;
    const value = headers[name] ?? headers[name.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
  } catch {
    return undefined;
  }
}

function statusFrom(error, explicit) {
  const candidates = [explicit, error?.statusCode, error?.status];
  for (const candidate of candidates) {
    const n = Number(candidate);
    if (Number.isInteger(n) && n >= 400 && n <= 599) return n;
  }
  return 500;
}

/**
 * Builds the SystemLog row for an error. Only an allow-list of request fields is
 * read; headers other than the request id, cookies and bodies are never touched.
 */
export function buildErrorEntry(error, { request, context, route, method, status, requestId, extra } = {}) {
  const err = error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Non-Error thrown');
  const headers = request?.headers;
  const data = {
    timestamp: new Date().toISOString(),
    route: truncate(context?.routePath ?? route ?? null, 300),
    path: sanitizePath(request?.path ?? request?.url ?? request?.nextUrl?.pathname ?? null),
    method: typeof (method ?? request?.method) === 'string' ? (method ?? request.method).toUpperCase().slice(0, 10) : null,
    status: statusFrom(err, status),
    requestId:
      sanitizeRequestId(requestId) ??
      sanitizeRequestId(readHeader(headers, 'x-vercel-id')) ??
      sanitizeRequestId(readHeader(headers, 'x-request-id')) ??
      randomUUID(),
    errorName: truncate(err.name, 100),
    stack: redactText(err.stack ?? null, LIMITS.stack),
    digest: typeof err.digest === 'string' ? err.digest.slice(0, 100) : undefined,
    routerKind: context?.routerKind,
    routeType: context?.routeType,
    renderSource: context?.renderSource,
    runtime: process.env.NEXT_RUNTIME || 'nodejs',
    env: process.env.VERCEL_ENV || process.env.NODE_ENV,
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
    region: process.env.VERCEL_REGION,
  };
  if (extra !== undefined) data.extra = sanitize(extra);
  for (const key of Object.keys(data)) if (data[key] === undefined) delete data[key];

  return {
    type: LOG_TYPES.error,
    message: redactText(err.message || err.name || 'Unknown error', LIMITS.message),
    data,
  };
}

function takeRateSlot(config, now) {
  if (now - state.windowStart >= 60_000) {
    state.windowStart = now;
    state.windowCount = 0;
  }
  if (state.windowCount >= config.maxPerMinute) return false;
  state.windowCount += 1;
  return true;
}

/** Writes one row. Resolves to true when written, false when skipped or failed. */
export async function writeSystemLog(entry) {
  try {
    const config = getConfig();
    const now = Date.now();
    if (!config.enabled || now < state.disabledUntil) return false;
    if (!takeRateSlot(config, now)) {
      state.droppedSinceLastWrite += 1;
      return false;
    }

    const data = { ...entry.data };
    if (state.droppedSinceLastWrite > 0) {
      data.droppedBeforeThis = state.droppedSinceLastWrite;
    }

    const result = await withTimeout(
      (async () => {
        const prisma = await getPrisma();
        if (!prisma?.systemLog) return 'unavailable';
        await prisma.systemLog.create({
          data: { type: entry.type, message: entry.message, data },
        });
        return 'ok';
      })(),
      config.timeoutMs,
    );

    if (result !== 'ok') {
      state.disabledUntil = Date.now() + FAILURE_COOLDOWN_MS;
      return false;
    }
    state.droppedSinceLastWrite = 0;
    maybePrune(config);
    return true;
  } catch (failure) {
    state.disabledUntil = Date.now() + FAILURE_COOLDOWN_MS;
    try {
      console.error('[server-log] SystemLog write failed:', redactText(failure?.message ?? failure, 300));
    } catch {
      // ignore
    }
    return false;
  }
}

/**
 * Deletes SERVER_* rows older than the retention window. Other SystemLog types
 * (automation triggers and similar) are left alone. Returns the number of rows
 * deleted, or null if the prune did not run.
 */
export async function pruneSystemLogs({ retentionDays, timeoutMs } = {}) {
  try {
    const config = getConfig();
    const days = Number.isInteger(retentionDays) && retentionDays > 0 ? retentionDays : config.retentionDays;
    const cutoff = new Date(Date.now() - days * 86_400_000);
    const result = await withTimeout(
      (async () => {
        const prisma = await getPrisma();
        if (!prisma?.systemLog) return null;
        const { count } = await prisma.systemLog.deleteMany({
          where: { type: { startsWith: TYPE_PREFIX }, createdAt: { lt: cutoff } },
        });
        return count;
      })(),
      timeoutMs ?? config.timeoutMs,
    );
    return typeof result === 'number' ? result : null;
  } catch {
    return null;
  }
}

// Not awaited: the request only ever waits on its own write. pruneSystemLogs never rejects.
function maybePrune(config) {
  const now = Date.now();
  if (now - state.lastPruneAt < config.pruneIntervalMs) return;
  state.lastPruneAt = now;
  pruneSystemLogs({ retentionDays: config.retentionDays, timeoutMs: config.timeoutMs * 4 });
}

/** Record an error (thrown or handled). Never throws. */
export async function logServerError(error, options = {}) {
  try {
    return await writeSystemLog(buildErrorEntry(error, options));
  } catch {
    return false;
  }
}

/** Record a non-error event, e.g. logServerEvent('warn', 'Stripe webhook retried', { eventId }). */
export async function logServerEvent(level, message, extra) {
  try {
    const type = LOG_TYPES[level] ?? LOG_TYPES.info;
    const data = { timestamp: new Date().toISOString() };
    if (extra !== undefined) data.extra = sanitize(extra);
    return await writeSystemLog({ type, message: redactText(message, LIMITS.message), data });
  } catch {
    return false;
  }
}

export function __setPrismaForTests(client) {
  prismaOverride = client;
}

export function __resetServerLogStateForTests() {
  state.windowStart = 0;
  state.windowCount = 0;
  state.disabledUntil = 0;
  state.lastPruneAt = 0;
  state.droppedSinceLastWrite = 0;
}
