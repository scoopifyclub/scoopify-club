import { NextResponse } from 'next/server';
import {
  INVALID_TOKEN_MESSAGE,
  isResetTokenValid,
  limitPasswordResetRequest,
  readJson,
  resetPasswordWithToken,
  resetResultResponse,
} from '@/lib/password-reset';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

// Request password reset
export { POST } from '@/app/api/auth/forgot-password/route';

// Reset password with token
export async function PUT(request) {
  const limited = await limitPasswordResetRequest(request);
  if (limited) return limited;

  const { token, newPassword, password } = await readJson(request);
  try {
    return resetResultResponse(await resetPasswordWithToken(token, newPassword ?? password));
  } catch (error) {
    console.error('Password reset failed:', error?.message);
    return resetResultResponse({ ok: false, status: 500, error: 'Failed to reset password' });
  }
}

// Check a reset token without revealing whose it is
export async function GET(request) {
  const limited = await limitPasswordResetRequest(request);
  if (limited) return limited;

  const token = new URL(request.url).searchParams.get('token');
  try {
    if (await isResetTokenValid(token)) {
      return NextResponse.json({ valid: true });
    }
  } catch (error) {
    console.error('Reset token check failed:', error?.message);
  }
  return NextResponse.json({ valid: false, error: INVALID_TOKEN_MESSAGE }, { status: 400 });
}
