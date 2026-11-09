import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { requireScooper, jobClaimErrorResponse } from '@/lib/job-claims';
import { saveChecklist } from '@/lib/job-completion';
import { authorizePhotoViewer } from '@/lib/service-photos';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function POST(request, { params }) {
    try {
        const { id } = await params;
        const auth = await requireScooper(request);
        if (!auth.ok) return auth.response;
        const body = await request.json().catch(() => ({}));
        const checklist = await saveChecklist({
            serviceId: id,
            employeeId: auth.employee.id,
            checklist: body?.checklist ?? body?.items ?? body,
        });
        return NextResponse.json(checklist);
    }
    catch (error) {
        return jobClaimErrorResponse(error, 'Failed to save checklist');
    }
}

// Same audience as the job's photos: assigned scooper, the customer, admins.
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const viewer = await authorizePhotoViewer(request, id);
        if (!viewer.ok) return viewer.response;
        const checklist = await prisma.serviceChecklist.findUnique({ where: { serviceId: id } });
        return NextResponse.json(checklist);
    }
    catch (error) {
        return jobClaimErrorResponse(error, 'Failed to fetch checklist');
    }
}
