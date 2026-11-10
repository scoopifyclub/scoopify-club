import { timingSafeEqual } from 'crypto';
import { requireAdmin } from '@/lib/admin-auth';

// Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; the manual GitHub
// workflow and scripts/run-cron.js send the same header. The secret is never
// accepted in the query string or body, where it would end up in access logs.
// With CRON_SECRET unset no request passes the secret check.
export function hasValidCronSecret(request) {
  const secret = process.env.CRON_SECRET;
  const header = request?.headers?.get?.('authorization') || '';
  if (!secret || !header.toLowerCase().startsWith('bearer ')) return false;
  const given = Buffer.from(header.slice(7).trim());
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Authorizes a cron route: the scheduler's Bearer CRON_SECRET, or a verified
 * admin session (for the admin "run now" buttons). Returns
 * `{ ok: true, via }` or `{ ok: false, response }`.
 */
export async function requireCronOrAdmin(request) {
  if (hasValidCronSecret(request)) return { ok: true, via: 'cron' };
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth;
  return { ok: true, via: 'admin', user: auth.user };
}
