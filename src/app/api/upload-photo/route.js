import { handlePhotoUploadRequest } from '@/lib/service-photos';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

// multipart/form-data: file (or photo), type (or category), serviceId
export async function POST(request) {
    return handlePhotoUploadRequest(request, undefined);
}
