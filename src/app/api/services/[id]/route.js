import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { validateUserToken } from '@/lib/jwt-utils';
import { requireAdmin } from '@/lib/admin-auth';
import { requireScooper, getAssignedJob, jobClaimErrorResponse } from '@/lib/job-claims';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

const SAFE_USER_SELECT = { select: { id: true, firstName: true, lastName: true, email: true } };

async function getTokenRole(req) {
    const header = req.headers.get('authorization');
    const bearer = header?.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : null;
    const token = bearer || req.cookies?.get('accessToken')?.value || req.cookies?.get('token')?.value;
    const decoded = token ? await validateUserToken(token) : null;
    return decoded ? { userId: decoded.userId, role: decoded.role } : null;
}

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        const user = await getTokenRole(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Scoopers only see a job (and its gate code) while it is assigned to them
        if (user.role === 'EMPLOYEE') {
            const auth = await requireScooper(req);
            if (!auth.ok) return auth.response;
            return NextResponse.json(await getAssignedJob({ serviceId: id, employeeId: auth.employee.id }));
        }

        if (user.role === 'ADMIN') {
            const auth = await requireAdmin(req);
            if (!auth.ok) return auth.response;
        } else if (user.role !== 'CUSTOMER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const service = await prisma.service.findUnique({
            where: { id },
            include: {
                customer: {
                    include: {
                        user: SAFE_USER_SELECT,
                        address: true,
                    },
                },
                employee: {
                    include: {
                        user: SAFE_USER_SELECT,
                    },
                },
                servicePlan: true,
                photos: true,
                checklist: true,
            },
        });
        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }
        if (user.role === 'CUSTOMER' && service.customer.userId !== user.userId) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }
        return NextResponse.json(service);
    }
    catch (error) {
        return jobClaimErrorResponse(error, 'Failed to fetch service');
    }
}
