import { handlePhotoListRequest, handlePhotoUploadRequest } from '@/lib/service-photos';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function POST(request, { params }) {
    const { jobId } = await params;
    return handlePhotoUploadRequest(request, jobId);
}

export async function GET(request, { params }) {
    const { jobId } = await params;
    return handlePhotoListRequest(request, jobId);
}
