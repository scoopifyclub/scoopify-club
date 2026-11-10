import { NextResponse } from 'next/server';
import {
  genericRequestResponse,
  limitPasswordResetRequest,
  readJson,
  requestPasswordReset,
} from '@/lib/password-reset';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function POST(request) {
  const limited = await limitPasswordResetRequest(request);
  if (limited) return limited;

  const { email } = await readJson(request);
  if (typeof email !== 'string' || !email.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  await requestPasswordReset(email);
  return genericRequestResponse();
}
