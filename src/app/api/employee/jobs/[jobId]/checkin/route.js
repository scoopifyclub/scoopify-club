import { handleCheckInRequest } from '@/lib/job-claims';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function POST(req, { params }) {
    const { jobId } = await params;
    return handleCheckInRequest(req, jobId);
}
