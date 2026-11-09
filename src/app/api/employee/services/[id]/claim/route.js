import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireScooper, claimService, jobClaimErrorResponse } from '@/lib/job-claims';

export const runtime = 'nodejs';

const fullName = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(' ');

export async function POST(request, { params }) {
    try {
        const { id: serviceId } = await params;

        const auth = await requireScooper(request);
        if (!auth.ok) return auth.response;

        const service = await claimService({ serviceId, employeeId: auth.employee.id });

        // Send notification to customer that job has been claimed
        let emailResult = null;
        try {
            const customerUser = (await prisma.customer.findUnique({
                where: { id: service.customerId },
                select: { user: { select: { email: true, firstName: true, lastName: true } } }
            }))?.user;
            const scooperUser = service.employee?.user;
            const { sendServiceClaimedEmail } = await import('@/lib/unified-email-service');
            emailResult = await sendServiceClaimedEmail(
                {
                    ...service,
                    customer: { user: { email: customerUser?.email, name: fullName(customerUser) } }
                },
                { user: { name: fullName(scooperUser), image: scooperUser?.image } }
            );
        } catch (emailError) {
            console.error('Email notification failed:', emailError);
            // Don't fail the entire request if email fails
            emailResult = { success: false, error: emailError.message };
        }

        return NextResponse.json({
            success: true,
            message: 'Service claimed successfully!',
            service,
            emailSent: emailResult?.success || false,
            emailError: emailResult?.error || null
        });

    } catch (error) {
        return jobClaimErrorResponse(error, 'Failed to claim service');
    }
}

export async function OPTIONS(request) {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}
