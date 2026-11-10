import { NextResponse } from 'next/server';
import { requireScooper, getAssignedJob, jobClaimErrorResponse } from '@/lib/job-claims';

export const runtime = 'nodejs';

// Gate code, street address, phone and notes for the scooper currently
// assigned to the job (claimed or checked in). Every reveal is logged.
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const auth = await requireScooper(request);
        if (!auth.ok) return auth.response;

        const job = await getAssignedJob({ serviceId: id, employeeId: auth.employee.id, reason: 'access' });
        return NextResponse.json({
            serviceId: job.id,
            gateCode: job.gateCode,
            address: job.customer.address,
            phone: job.customer.phone,
            notes: job.notes,
            claimExpiresAt: job.status === 'PENDING' ? job.claimExpiresAt : null
        });
    } catch (error) {
        return jobClaimErrorResponse(error, 'Failed to load job access details');
    }
}
