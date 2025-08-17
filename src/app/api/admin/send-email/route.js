import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/api-auth';
import { cookies } from 'next/headers';
import prisma from "@/lib/prisma";
import { sendEmail } from '@/lib/email-service';

// Force Node.js runtime for Prisma and other Node.js APIs
export const runtime = 'nodejs';

export async function POST(request) {
    try {
        // Get access token from cookies
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('accessToken')?.value;
        
        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Validate the token and check role
        const { userId, role } = await validateUser(accessToken);
        if (role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

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
