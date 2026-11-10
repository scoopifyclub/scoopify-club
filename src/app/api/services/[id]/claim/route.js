import { NextResponse } from 'next/server';
import { requireScooper, claimService, jobClaimErrorResponse } from '@/lib/job-claims';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function POST(req, { params }) {
    try {
        const { id } = await params;
        const auth = await requireScooper(req);
        if (!auth.ok) return auth.response;

        const updatedService = await claimService({ serviceId: id, employeeId: auth.employee.id });
        return NextResponse.json(updatedService);
    }
    catch (error) {
        return jobClaimErrorResponse(error, 'Failed to claim service');
    }
}
