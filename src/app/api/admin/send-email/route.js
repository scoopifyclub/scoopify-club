import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import prisma from "@/lib/prisma";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
                        name: true
                    }
                }
            }
        });

        if (!employee) {
            return new NextResponse('Employee not found', { status: 404 });
        }

        // Send email
        await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: employee.user.email,
            subject: subject,
            html: `
        <h1>${subject}</h1>
        <p>Hello ${employee.user.name || 'Employee'},</p>
        <p>${message}</p>
        <p>Best regards,<br>Scoopify Club Team</p>
      `
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sending email:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
