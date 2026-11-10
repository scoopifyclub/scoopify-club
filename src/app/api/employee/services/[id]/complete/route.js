import { handleCompleteRequest } from '@/lib/job-completion';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function POST(request, { params }) {
    const { id } = await params;
    return handleCompleteRequest(request, id);
}
