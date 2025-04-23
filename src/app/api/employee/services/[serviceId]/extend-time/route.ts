import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import prisma from "@/lib/prisma";



export async function POST(
  request: Request,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    // Get access token from cookies
const cookieStore = await cookies();
const accessToken = cookieStore.get('accessToken')?.value;

if (!accessToken) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Validate the token and check role
const { userId, role } = await validateUser(accessToken);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { minutes } = await request.json();
    const serviceId = (await params).serviceId;

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