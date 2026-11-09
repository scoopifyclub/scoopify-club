import { NextResponse } from 'next/server';
import { requireScooper, claimService, jobClaimErrorResponse } from '@/lib/job-claims';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


export async function POST(request) {
    try {
        const auth = await requireScooper(request);
        if (!auth.ok) return auth.response;

        const { jobId } = await request.json().catch(() => ({}));
        const job = await claimService({ serviceId: jobId, employeeId: auth.employee.id });

        return NextResponse.json({ success: true, job });
    } catch (error) {
        return jobClaimErrorResponse(error, 'Failed to claim job');
    }
}
