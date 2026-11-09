import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { sendEmail } from '@/lib/email-service';
import { requireAdmin } from '@/lib/admin-auth';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function POST(request) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        const { employeeId, subject, message } = await request.json();

        // Get employee details
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                user: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        if (!employee) {
            return new NextResponse('Employee not found', { status: 404 });
        }

        // Send email using our email service
        const emailResult = await sendEmail({
            to: employee.user.email,
            subject: subject,
            html: `
        <h1>${subject}</h1>
        <p>Hello ${employee.user.firstName || employee.user.lastName || 'Employee'},</p>
        <p>${message}</p>
        <p>Best regards,<br>Scoopify Club Team</p>
      `
        });

        if (!emailResult.success) {
            throw new Error('Failed to send email');
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sending email:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
