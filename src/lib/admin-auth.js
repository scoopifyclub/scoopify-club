import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';
import { validateUserToken, computeAdminSessionVersion } from '@/lib/jwt-utils';
import { getRequestAuthToken } from '@/lib/auth-cookies';

/**
 * Verified admin emails, from the comma-separated ADMIN_EMAILS env var.
 * Admin access fails closed when it is unset: an account with role ADMIN in
 * the database is not enough on its own, because self-signup used to accept
 * role=ADMIN and such accounts may exist in production.
 */
export function getAdminEmailAllowlist() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowlistedAdminEmail(email) {
  if (!email) return false;
  return getAdminEmailAllowlist().includes(email.trim().toLowerCase());
}

function sameSessionVersion(expected, actual) {
  if (typeof expected !== 'string' || typeof actual !== 'string') return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);
  return a.length === b.length && timingSafeEqual(a, b);
}

function deny(status, error) {
  return { ok: false, status, error, response: NextResponse.json({ error }, { status }) };
}

/**
 * Server-side admin authorization for privileged API routes and pages.
 * Independently of middleware, it verifies the JWT, then re-reads the user
 * from the database and requires: role ADMIN in the DB, an allowlisted email,
 * and a session version (`sv`) that matches the account's current state.
 *
 * Usage in a route handler:
 *   const auth = await requireAdmin(request);
 *   if (!auth.ok) return auth.response;
 *
 * @param {Request} [request] - Incoming request; cookies() is used when omitted.
 * @returns {Promise<{ok: boolean, response?: NextResponse, status?: number, error?: string, user?: object, userId?: string, role?: string}>}
 *   On success `ok` is true and user/userId/role are set; otherwise `response` is the 401/403 to return.
 */
export async function requireAdmin(request) {
  let token;
  try {
    token = await getRequestAuthToken(request);
  } catch {
    token = null;
  }
  if (!token) {
    return deny(401, 'Authentication required');
  }

  const decoded = await validateUserToken(token);
  if (!decoded) {
    return deny(401, 'Invalid or expired session');
  }
  if (decoded.role !== 'ADMIN') {
    return deny(403, 'Admin access required');
  }

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        password: true,
        firstName: true,
        lastName: true,
      },
    });
  } catch (error) {
    console.error('Admin authorization lookup failed:', error);
    return deny(503, 'Unable to verify admin session');
  }

  if (!user || user.role !== 'ADMIN') {
    return deny(403, 'Admin access required');
  }
  if (!isAllowlistedAdminEmail(user.email)) {
    console.warn('Denied admin access for non-allowlisted ADMIN account', { userId: user.id });
    return deny(403, 'Admin access required');
  }

  const expectedVersion = await computeAdminSessionVersion(user);
  if (!sameSessionVersion(expectedVersion, decoded.sv)) {
    return deny(401, 'Admin session is no longer valid. Please sign in again.');
  }

  const { password: _password, ...safeUser } = user;
  return { ok: true, user: { ...safeUser, userId: user.id }, userId: user.id, role: user.role };
}

/**
 * For routes shared by several roles where an ADMIN claim grants access to
 * other users' data: the claim only counts if requireAdmin() accepts it.
 * Returns an error response to send, or null to continue.
 */
export async function denyUnverifiedAdmin(request, role) {
  if (role !== 'ADMIN') return null;
  const auth = await requireAdmin(request);
  return auth.ok ? null : auth.response;
}
