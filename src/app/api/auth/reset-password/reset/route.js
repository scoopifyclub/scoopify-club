import {
  limitPasswordResetRequest,
  readJson,
  resetPasswordWithToken,
  resetResultResponse,
} from '@/lib/password-reset';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function POST(request) {
  const limited = await limitPasswordResetRequest(request);
  if (limited) return limited;

  const { token, password } = await readJson(request);
  try {
    return resetResultResponse(await resetPasswordWithToken(token, password));
  } catch (error) {
    console.error('Password reset failed:', error?.message);
    return resetResultResponse({ ok: false, status: 500, error: 'Failed to reset password' });
  }
}
