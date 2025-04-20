import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { serviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { minutes } = await request.json();
    const serviceId = params.serviceId;

    // Get the service and employee
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        subscription: {
          include: {
            customer: true
          }
        }
      }
    });

    if (!service) {
      return new NextResponse('Service not found', { status: 404 });
    }

    // Create time extension record
    const timeExtension = await prisma.timeExtension.create({
      data: {
        serviceId,
        employeeId: service.employeeId,
        minutes,
      }
    });

    // Update service arrival deadline
    const newDeadline = new Date(service.scheduledDate);
    newDeadline.setMinutes(newDeadline.getMinutes() + minutes);

    await prisma.service.update({
      where: { id: serviceId },
      data: {
        arrivalDeadline: newDeadline
      }
    });

    return NextResponse.json(timeExtension);
  } catch (error) {
    console.error('Error extending time:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 