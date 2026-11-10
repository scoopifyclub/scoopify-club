/**
 * Single session cookie contract for customer, scooper, and admin sign-in.
 *
 * Access sessions live in httpOnly `accessToken`. Refresh lives in
 * `refreshToken`. Legacy names (`token`, `adminToken`, `*_client`) are still
 * cleared on logout/reset and briefly accepted when reading so older browsers
 * keep working until their next sign-in.
 */

export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';
/** @deprecated Prefer ACCESS_TOKEN_COOKIE; still read as a fallback. */
export const LEGACY_TOKEN_COOKIE = 'token';

export const AUTH_COOKIES = [
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  LEGACY_TOKEN_COOKIE,
  'adminToken',
  'accessToken_client',
  'refreshToken_client',
  'fingerprint',
];

const DEFAULT_ACCESS_MAX_AGE = 15 * 60;
const DEFAULT_REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

function cookieDefaults(maxAge) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  };
}

/**
 * Resolve a cookie store from a Request, NextRequest, or next/headers cookies().
 * @param {Request|null|undefined} request
 * @returns {Promise<{get: Function, set?: Function, delete?: Function}|null>}
 */
export async function getCookieStore(request) {
  if (request?.cookies?.get) {
    return request.cookies;
  }
  try {
    const { cookies } = await import('next/headers');
    return await cookies();
  } catch {
    return null;
  }
}

function readAccessCookie(cookieStore) {
  if (!cookieStore?.get) return null;
  return (
    cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ||
    cookieStore.get(LEGACY_TOKEN_COOKIE)?.value ||
    null
  );
}

/**
 * Bearer token from Authorization, otherwise the session cookie.
 * Prefers `accessToken`, then legacy `token`. Never treats refresh JWTs as
 * access sessions. Falls back to next/headers `cookies()` when the request
 * jar has no session (App Router handlers often rely on that store in tests).
 * @param {Request|null|undefined} request
 * @returns {Promise<string|null>}
 */
export async function getRequestAuthToken(request) {
  const header = request?.headers?.get?.('authorization');
  if (header && header.toLowerCase().startsWith('bearer ')) {
    const bearer = header.slice(7).trim();
    if (bearer && bearer !== 'null' && bearer !== 'undefined') {
      return bearer;
    }
  }

  try {
    const fromRequest = readAccessCookie(request?.cookies);
    if (fromRequest) return fromRequest;

    const { cookies } = await import('next/headers');
    return readAccessCookie(await cookies());
  } catch {
    // next/headers cookies() is unavailable in some cron/edge test contexts
    return null;
  }
}

/**
 * Write the unified session cookies onto a NextResponse (or compatible jar).
 * @param {{cookies: {set: Function}}} response
 * @param {{accessToken: string, refreshToken?: string|null}} tokens
 * @param {{accessMaxAge?: number, refreshMaxAge?: number, sameSite?: string}} [options]
 */
export function setSessionCookies(response, { accessToken, refreshToken = null }, options = {}) {
  if (!accessToken || !response?.cookies?.set) return;

  const sameSite = options.sameSite || 'lax';
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...cookieDefaults(options.accessMaxAge ?? DEFAULT_ACCESS_MAX_AGE),
    sameSite,
  });

  if (refreshToken) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...cookieDefaults(options.refreshMaxAge ?? DEFAULT_REFRESH_MAX_AGE),
      sameSite,
    });
  }
}

/**
 * Write session cookies through next/headers `cookies()` (auth/login style).
 * @param {{set: Function}} cookieStore
 * @param {{accessToken: string, refreshToken?: string|null}} tokens
 * @param {{accessMaxAge?: number, refreshMaxAge?: number, sameSite?: string}} [options]
 */
export function setSessionCookiesOnStore(cookieStore, { accessToken, refreshToken = null }, options = {}) {
  if (!accessToken || !cookieStore?.set) return;

  const sameSite = options.sameSite || 'lax';
  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...cookieDefaults(options.accessMaxAge ?? DEFAULT_ACCESS_MAX_AGE),
    sameSite,
  });

  if (refreshToken) {
    cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...cookieDefaults(options.refreshMaxAge ?? DEFAULT_REFRESH_MAX_AGE),
      sameSite,
    });
  }
}

/**
 * Clear every known auth cookie on a NextResponse.
 * @param {{cookies: {delete: Function}}} response
 */
export function clearSessionCookies(response) {
  if (!response?.cookies?.delete) return;
  for (const name of AUTH_COOKIES) {
    try {
      response.cookies.delete(name);
    } catch (error) {
      console.error(`Error deleting cookie ${name}:`, error);
    }
  }
}

/**
 * Clear every known auth cookie on a next/headers cookie store.
 * @param {{delete: Function}} cookieStore
 */
export function clearSessionCookiesOnStore(cookieStore) {
  if (!cookieStore?.delete) return;
  for (const name of AUTH_COOKIES) {
    try {
      cookieStore.delete(name);
    } catch (error) {
      console.error(`Error deleting cookie ${name}:`, error);
    }
  }
}
