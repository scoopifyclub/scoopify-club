import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'EMPLOYEE') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { serviceId } = await request.json();

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        subscription: {
          include: {
            customer: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!service) {
      return new NextResponse('Service not found', { status: 404 });
    }

    // Update service status
    await prisma.service.update({
      where: { id: serviceId },
      data: {
        status: 'RESCHEDULED',
      },
    });

    // Send email notification
    await resend.emails.send({
      from: 'Scoopify Club <notifications@scoopify.club>',
      to: service.subscription.customer.user.email,
      subject: 'Service Delay Due to Weather',
      html: `
        <h1>Service Delay Notification</h1>
        <p>Hello,</p>
        <p>Due to inclement weather, we need to delay your scheduled service. We will reschedule your service for the next available day.</p>
        <p>Thank you for your understanding.</p>
        <p>Best regards,<br>Scoopify Club Team</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling weather delay:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 