import { createHash, randomBytes } from 'crypto';
import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validatePassword } from '@/lib/password';
import { sendPasswordResetEmail } from '@/lib/email-service';
import { AuthRateLimiter } from '@/lib/auth-rate-limit';
import { edgeRateLimit } from '@/lib/edge-rate-limit';

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
// A new link is not emailed while one issued less than this long ago is still valid
export const RESET_RESEND_INTERVAL_MS = 60 * 1000;
export const BCRYPT_ROUNDS = 12;

export const GENERIC_REQUEST_MESSAGE =
  'If an account exists for that email, a password reset link has been sent.';
export const INVALID_TOKEN_MESSAGE = 'This password reset link is invalid or has expired.';

const TOKEN_PATTERN = /^[a-f0-9]{64}$/;
const AUTH_COOKIES = ['accessToken', 'refreshToken', 'token', 'adminToken', 'accessToken_client', 'refreshToken_client'];

/**
 * Only this SHA-256 digest is stored in User.resetToken; the raw token exists
 * only in the emailed link, so a database read does not yield usable tokens.
 */
export function hashResetToken(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}

function isWellFormedToken(token) {
  return typeof token === 'string' && TOKEN_PATTERN.test(token);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

async function findUserByEmail(email) {
  const matches = await prisma.user.findMany({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true, email: true, firstName: true, resetTokenExpiry: true },
    take: 5,
  });
  if (matches.length === 1) return matches[0];
  return matches.find((user) => user.email === email) || null;
}

/**
 * Issues a reset link if the email belongs to an account. Always resolves the
 * same way whether or not the account exists, so callers must return the same
 * response in both cases.
 */
export async function requestPasswordReset(rawEmail) {
  const email = typeof rawEmail === 'string' ? rawEmail.trim() : '';
  if (!email) return;

  try {
    const user = await findUserByEmail(email);
    if (!user) return;

    const now = Date.now();
    const pendingExpiry = user.resetTokenExpiry ? new Date(user.resetTokenExpiry).getTime() : 0;
    if (pendingExpiry - RESET_TOKEN_TTL_MS + RESET_RESEND_INTERVAL_MS > now) return;

    const token = randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashResetToken(token),
        resetTokenExpiry: new Date(now + RESET_TOKEN_TTL_MS),
        updatedAt: new Date(now),
      },
    });

    await sendPasswordResetEmail(user.email, escapeHtml(user.firstName || 'there'), token);
  } catch (error) {
    console.error('Password reset request failed:', error?.message);
  }
}

async function findUserByResetToken(token) {
  if (!isWellFormedToken(token)) return null;
  return prisma.user.findFirst({
    where: { resetToken: hashResetToken(token), resetTokenExpiry: { gt: new Date() } },
    select: { id: true },
  });
}

export async function isResetTokenValid(token) {
  return Boolean(await findUserByResetToken(token));
}

/**
 * Sets a new bcrypt password if the token is valid, unexpired and unused.
 * The token is consumed in the same conditional write that sets the password,
 * so concurrent submissions of one token succeed at most once. Changing the
 * password hash invalidates every session token's `sv` claim, and stored
 * refresh tokens are deleted.
 * @returns {Promise<{ok: true} | {ok: false, status: number, error: string, details?: string[]}>}
 */
export async function resetPasswordWithToken(token, password) {
  if (typeof token !== 'string' || !token || typeof password !== 'string' || !password) {
    return { ok: false, status: 400, error: 'Token and new password are required' };
  }

  const user = await findUserByResetToken(token);
  if (!user) {
    return { ok: false, status: 400, error: INVALID_TOKEN_MESSAGE };
  }

  const validation = validatePassword(password);
  if (!validation.isValid) {
    return { ok: false, status: 400, error: 'Password does not meet requirements', details: validation.errors };
  }

  const tokenHash = hashResetToken(token);
  const passwordHash = await hash(password, BCRYPT_ROUNDS);
  const now = new Date();

  const consumed = await prisma.$transaction(async (tx) => {
    const { count } = await tx.user.updateMany({
      where: { id: user.id, resetToken: tokenHash, resetTokenExpiry: { gt: now } },
      data: { password: passwordHash, resetToken: null, resetTokenExpiry: null, updatedAt: now },
    });
    if (count !== 1) return false;
    await tx.refreshToken.deleteMany({ where: { userId: user.id } });
    return true;
  });

  if (!consumed) {
    return { ok: false, status: 400, error: INVALID_TOKEN_MESSAGE };
  }
  return { ok: true };
}

/**
 * Per-IP limit for the reset endpoints: the Upstash limiter used by login
 * when it is configured, otherwise the in-memory limiter used by signup.
 * Returns a 429 response to send, or null to continue.
 */
export async function limitPasswordResetRequest(request) {
  const result = await new AuthRateLimiter().isAllowed(request);
  if (!result.success) {
    const response = NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
    result.headers.forEach((value, key) => response.headers.set(key, value));
    return response;
  }
  if (result.limit === 0) {
    return edgeRateLimit.limit(request);
  }
  return null;
}

export function genericRequestResponse() {
  return NextResponse.json({ success: true, message: GENERIC_REQUEST_MESSAGE });
}

export function resetResultResponse(result) {
  if (!result.ok) {
    const body = { error: result.error, message: result.error };
    if (result.details) body.details = result.details;
    return NextResponse.json(body, { status: result.status });
  }
  const response = NextResponse.json({
    success: true,
    message: 'Your password has been reset. Please sign in with your new password.',
  });
  for (const name of AUTH_COOKIES) {
    response.cookies.delete(name);
  }
  return response;
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
