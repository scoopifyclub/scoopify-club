import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const EMPLOYEE_SELECT = {
    id: true,
    status: true,
    approvedAt: true,
    approvedBy: true,
    user: { select: { id: true, email: true, firstName: true, lastName: true } }
};

async function setApproval(request, params, approve) {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { employeeId } = await params;
    const existing = await prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true } });
    if (!existing) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const now = new Date();
    const employee = await prisma.employee.update({
        where: { id: employeeId },
        data: approve
            ? { status: 'ACTIVE', approvedAt: now, approvedBy: auth.userId, updatedAt: now }
            : { approvedAt: null, approvedBy: null, updatedAt: now },
        select: EMPLOYEE_SELECT
    });

    await prisma.systemLog.create({
        data: {
            type: approve ? 'SCOOPER_APPROVED' : 'SCOOPER_APPROVAL_REVOKED',
            message: `Scooper ${employeeId} ${approve ? 'approved' : 'approval revoked'} by admin ${auth.userId}`,
            data: { employeeId, adminUserId: auth.userId, at: now }
        }
    }).catch((error) => console.error('Failed to log scooper approval change:', error));

    return NextResponse.json({ success: true, employee });
}

// Approve a scooper so they can see and claim jobs.
export async function POST(request, { params }) {
    try {
        return await setApproval(request, params, true);
    } catch (error) {
        console.error('Error approving scooper:', error);
        return NextResponse.json({ error: 'Failed to approve scooper' }, { status: 500 });
    }
}

// Revoke approval; the scooper can no longer see or claim jobs. Jobs they
// already hold are released by the normal claim expiry or by an admin.
export async function DELETE(request, { params }) {
    try {
        return await setApproval(request, params, false);
    } catch (error) {
        console.error('Error revoking scooper approval:', error);
        return NextResponse.json({ error: 'Failed to revoke scooper approval' }, { status: 500 });
    }
}
