import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/api-auth';

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: user.userId },
      include: { serviceAreas: true }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Example stats - replace with your actual logic
    const totalServices = await prisma.service.count({ where: { employeeId: employee.id } });
    const completedServices = await prisma.service.count({ where: { employeeId: employee.id, status: 'COMPLETED' } });
    const earnings = await prisma.earning.aggregate({
      _sum: { amount: true },
      where: { employeeId: employee.id }
    });
    const customerCount = await prisma.customer.count({ where: { services: { some: { employeeId: employee.id } } } });

    return NextResponse.json({
      totalServices,
      completedServices,
      earnings: earnings._sum.amount || 0,
      customerCount,
      hasSetServiceArea: employee.hasSetServiceArea,
      serviceAreas: employee.serviceAreas
    });
  } catch (error) {
    console.error('Failed to fetch employee stats:', error);
    return NextResponse.json({ error: 'Failed to fetch employee stats' }, { status: 500 });
  }
}
