import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import prisma from "@/lib/prisma";



export async function GET(
  request: Request,
  { params }: { params: { employeeId: string } }
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
    if (!session?.user || role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { employeeId } = params;

    // Get all services for the employee
    const services = await prisma.service.findMany({
      where: {
        employeeId,
      },
      include: {
        timeExtensions: true,
      },
    });

    // Calculate metrics
    const totalServices = services.length;
    const completedServices = services.filter(s => s.status === 'COMPLETED').length;
    const timeExtensions = services.reduce((acc, service) => acc + service.timeExtensions.length, 0);
    const cancellations = services.filter(s => s.status === 'CANCELLED').length;

    // Calculate average service time (placeholder - you'll need to implement actual time tracking)
    const averageTime = 30; // Default to 30 minutes

    return NextResponse.json({
      totalServices,
      completedServices,
      averageTime,
      timeExtensions,
      cancellations,
    });
  } catch (error) {
    console.error('Error fetching employee metrics:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 