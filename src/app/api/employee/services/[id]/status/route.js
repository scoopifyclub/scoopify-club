import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleCheckInRequest } from '@/lib/job-claims';
import { handleCompleteRequest } from '@/lib/job-completion';

export const runtime = 'nodejs';

const statusUpdateSchema = z.object({
    status: z.enum(['ARRIVED', 'IN_PROGRESS', 'COMPLETED']),
    notes: z.string().optional(),
    checklist: z.any().optional(),
    checklistItems: z.any().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});

// ARRIVED / IN_PROGRESS is a check-in and COMPLETED is a completion; both go
// through the same rules as the dedicated routes.
export async function POST(request, { params }) {
    const { id: serviceId } = await params;
    const parsed = statusUpdateSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid request data', details: parsed.error.errors }, { status: 400 });
    }
    if (parsed.data.status === 'COMPLETED') {
        return handleCompleteRequest(request, serviceId, parsed.data);
    }
    const checkInRequest = new NextRequest(request.url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify({ latitude: parsed.data.latitude, longitude: parsed.data.longitude }),
    });
    return handleCheckInRequest(checkInRequest, serviceId);
}

export async function OPTIONS(request) {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}
