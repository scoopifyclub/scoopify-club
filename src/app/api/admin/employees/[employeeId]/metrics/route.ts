import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { employeeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
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