import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { jobClaimErrorResponse } from '@/lib/job-claims';
import { getCompletionEvidence } from '@/lib/job-completion';

export const runtime = 'nodejs';

// Completion evidence for one job: status and timestamps, checklist, photos
// (short-lived signed URLs), the recorded earning and the email outcome.
export async function GET(request, { params }) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;
        const { id } = await params;
        const evidence = await getCompletionEvidence({ serviceId: id });
        return NextResponse.json(evidence, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    catch (error) {
        return jobClaimErrorResponse(error, 'Failed to load completion evidence');
    }
}
