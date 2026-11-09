import { NextResponse } from 'next/server';
import { handlePhotoListRequest, handlePhotoUploadRequest } from '@/lib/service-photos';

export const runtime = 'nodejs';

// Upload: multipart { file, type } (up to 4 MB), or JSON { key, type } to
// confirm a direct upload made with .../photos/upload-url.
export async function POST(request, { params }) {
    const { id } = await params;
    return handlePhotoUploadRequest(request, id);
}

export async function GET(request, { params }) {
    const { id } = await params;
    return handlePhotoListRequest(request, id);
}

export async function OPTIONS(request) {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}
