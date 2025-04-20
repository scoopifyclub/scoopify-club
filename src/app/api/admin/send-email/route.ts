import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { employeeId, subject, message } = await request.json();

    // Get employee details
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        email: true,
        name: true
      }
    });

    if (!employee) {
      return new NextResponse('Employee not found', { status: 404 });
    }

    // Send email
    await resend.emails.send({
      from: 'Scoopify Club <admin@scoopify.club>',
      to: employee.email,
      subject: subject,
      html: `
        <h1>${subject}</h1>
        <p>Hello ${employee.name},</p>
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