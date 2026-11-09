import { handlePhotoUploadUrlRequest } from '@/lib/service-photos';

export const runtime = 'nodejs';

// Body: { type, contentType, size }. Returns a signed PUT URL; confirm with
// POST /api/employee/services/<id>/photos { key, type } after uploading.
export async function POST(request, { params }) {
    const { id } = await params;
    return handlePhotoUploadUrlRequest(request, id);
}
