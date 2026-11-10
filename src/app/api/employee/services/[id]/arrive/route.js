import { handleCheckInRequest } from '@/lib/job-claims';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function POST(request, { params }) {
    const { id } = await params;
    return handleCheckInRequest(request, id);
}
