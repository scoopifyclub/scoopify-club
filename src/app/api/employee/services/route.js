import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireScooper, releaseExpiredClaims, claimService, jobClaimErrorResponse, UNCLAIMED_JOB_CUSTOMER_SELECT } from '@/lib/job-claims';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';


export async function GET(request) {
    try {
        const auth = await requireScooper(request);
        if (!auth.ok) return auth.response;

        await releaseExpiredClaims();

        // Get available services
        const services = await prisma.service.findMany({
            where: {
                status: 'SCHEDULED',
                employeeId: null, // Only show unassigned services
            },
            omit: { notes: true },
            include: {
                customer: UNCLAIMED_JOB_CUSTOMER_SELECT,
                servicePlan: true
            },
            orderBy: {
                scheduledDate: 'asc'
            }
        });

        return NextResponse.json(services);
    } catch (error) {
        console.error('Error fetching services:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const auth = await requireScooper(req);
        if (!auth.ok) return auth.response;

        const { serviceId } = await req.json().catch(() => ({}));
        if (!serviceId) {
            return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
        }

        const updatedService = await claimService({ serviceId, employeeId: auth.employee.id });
        return NextResponse.json(updatedService);
    } catch (error) {
        return jobClaimErrorResponse(error, 'Failed to claim service');
    }
}
