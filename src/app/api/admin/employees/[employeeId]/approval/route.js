import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { sendEmail } from '@/lib/email-service';
import { escapeHtml } from '@/lib/escape-html';
import { ACTIVE_JOB_STATUSES } from '@/lib/job-claims';

export const runtime = 'nodejs';

const EMPLOYEE_SELECT = {
    id: true,
    status: true,
    approvedAt: true,
    approvedBy: true,
    user: { select: { id: true, email: true, firstName: true, lastName: true } }
};
function appUrl() {
    return (process.env.NEXT_PUBLIC_APP_URL || 'https://www.scoopify.club').replace(/\/$/, '');
}

async function sendApprovalEmail(user) {
    if (!user?.email) return false;
    const name = escapeHtml(user.firstName || 'there');
    const jobsUrl = `${appUrl()}/employee/dashboard`;
    try {
        await sendEmail(user.email, 'custom', {
            subject: 'You are approved to scoop with Scoopify Club',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #10b981;">You're approved!</h2>
                    <p>Hi ${name},</p>
                    <p>Your Scoopify Club scooper account has been approved. You can now see and claim jobs in your area.</p>
                    <p><a href="${jobsUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Open your scooper dashboard</a></p>
                    <p>Best regards,<br>The Scoopify Club Team</p>
                </div>
            `
        });
        return true;
    } catch (error) {
        console.error('Failed to send scooper approval email:', error);
        return false;
    }
}

async function setApproval(request, params, approve) {
    const auth = await requireAdmin(request);
    if (!auth.ok) return auth.response;

    const { employeeId } = await params;
    const existing = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: { id: true, status: true, approvedAt: true }
    });
    if (!existing) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const wasApproved = Boolean(existing.approvedAt && existing.status === 'ACTIVE');
    const now = new Date();
    const employee = await prisma.employee.update({
        where: { id: employeeId },
        data: approve
            ? { status: 'ACTIVE', approvedAt: wasApproved ? existing.approvedAt : now, approvedBy: auth.userId, updatedAt: now }
            : { status: 'INACTIVE', approvedAt: null, approvedBy: null, updatedAt: now },
        select: EMPLOYEE_SELECT
    });

    await prisma.systemLog.create({
        data: {
            type: approve ? 'SCOOPER_APPROVED' : 'SCOOPER_APPROVAL_REVOKED',
            message: `Scooper ${employeeId} ${approve ? 'approved' : 'approval revoked'} by admin ${auth.userId}`,
            data: { employeeId, adminUserId: auth.userId, at: now }
        }
    }).catch((error) => console.error('Failed to log scooper approval change:', error));

    if (approve) {
        const emailSent = wasApproved ? false : await sendApprovalEmail(employee.user);
        return NextResponse.json({ success: true, employee, emailSent });
    }

    const activeJobs = await prisma.service.count({
        where: { employeeId, status: { in: ACTIVE_JOB_STATUSES } }
    });
    return NextResponse.json({ success: true, employee, activeJobs });
}

// Approve a scooper so they can see and claim jobs, and email them (best effort).
export async function POST(request, { params }) {
    try {
        return await setApproval(request, params, true);
    } catch (error) {
        console.error('Error approving scooper:', error);
        return NextResponse.json({ error: 'Failed to approve scooper' }, { status: 500 });
    }
}

// Reject a pending scooper or deactivate an approved one: they can no longer
// see or claim jobs. Jobs they already hold are released by the normal claim
// expiry or by an admin; `activeJobs` in the response says how many remain.
export async function DELETE(request, { params }) {
    try {
        return await setApproval(request, params, false);
    } catch (error) {
        console.error('Error revoking scooper approval:', error);
        return NextResponse.json({ error: 'Failed to revoke scooper approval' }, { status: 500 });
    }
}
