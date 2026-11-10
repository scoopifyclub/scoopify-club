import { handlePhotoDeleteRequest, handlePhotoListRequest, handlePhotoUploadRequest } from '@/lib/service-photos';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function POST(request, { params }) {
    const { id } = await params;
    return handlePhotoUploadRequest(request, id);
}

export async function GET(request, { params }) {
    const { id } = await params;
    return handlePhotoListRequest(request, id);
}

export async function DELETE(request, { params }) {
    const { id } = await params;
    return handlePhotoDeleteRequest(request, id);
}
