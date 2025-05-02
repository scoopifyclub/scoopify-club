import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/api-auth';

// POST: Mark a job as 'arrived' (scooper has arrived at the customer's location)
export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await request.json();
  const { serviceId } = data;
  if (!serviceId) {
    return NextResponse.json({ error: 'Missing serviceId' }, { status: 400 });
  }

  // Find the service and check if the user is assigned
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || service.employeeId !== user.userId) {
    return NextResponse.json({ error: 'Not authorized for this job' }, { status: 403 });
  }
  // Update service status and record arrival time
  await prisma.service.update({
    where: { id: serviceId },
    data: {
      workflowStatus: 'ARRIVED',
      arrivedAt: new Date(),
    },
  });
  // Optionally: unlock customer details for the scooper
  return NextResponse.json({ success: true });
}
