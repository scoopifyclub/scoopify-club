import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Job photos are private to the job's customer, its scooper and admins, so
// public share links are not offered.
const gone = () =>
  NextResponse.json({ error: 'Photo sharing is not available', code: 'PHOTO_SHARING_DISABLED' }, { status: 410 });

export const GET = gone;
export const POST = gone;
export const DELETE = gone;
