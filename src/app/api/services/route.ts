import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withDatabase } from '@/middleware/db';
import { requireAuth } from '@/lib/api-auth';
import { sendServiceNotificationEmail } from '@/lib/email';

const handler = async (req: Request) => {
  try {
    const user = await requireAuth(req as any);
    
    if (req.method === 'POST') {
      // Only customers can create services
      if (user.role !== 'CUSTOMER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { scheduledFor, servicePlanId, specialInstructions } = await req.json();

      if (!servicePlanId) {
        return NextResponse.json(
          { error: 'Service plan ID is required' },
          { status: 400 }
        );
      }

      const customer = await prisma.customer.findUnique({
        where: { userId: user.id },
        include: {
          user: true,
          address: true,
        },
      });

      if (!customer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }

      // Verify service plan exists and is active
      const servicePlan = await prisma.servicePlan.findUnique({
        where: { id: servicePlanId },
      });

      if (!servicePlan || !servicePlan.isActive) {
        return NextResponse.json(
          { error: 'Invalid service plan' },
          { status: 400 }
        );
      }

      const service = await prisma.service.create({
        data: {
          customerId: customer.id,
          servicePlanId,
          scheduledDate: new Date(scheduledFor),
          status: 'SCHEDULED',
          specialInstructions,
        },
        include: {
          customer: {
            include: {
              user: true,
              address: true,
            },
          },
          servicePlan: true,
        },
      });

      // Send notification email
      await sendServiceNotificationEmail(service);

      return NextResponse.json(service);
    } else if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      if (!startDate || !endDate) {
        return NextResponse.json(
          { error: 'Start and end dates are required' },
          { status: 400 }
        );
      }

      const where = {
        scheduledDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        ...(user.role === 'CUSTOMER' && { customerId: user.customerId }),
        ...(user.role === 'EMPLOYEE' && { employeeId: user.employeeId }),
      };

      const services = await prisma.service.findMany({
        where,
        include: {
          customer: {
            include: {
              user: true,
              address: true,
            },
          },
          employee: {
            include: {
              user: true,
            },
          },
          servicePlan: true,
        },
        orderBy: {
          scheduledDate: 'asc',
        },
      });

      return NextResponse.json(services);
    }

    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  } catch (error) {
    console.error('Error in services route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

export const POST = withDatabase(handler);
export const GET = withDatabase(handler); 