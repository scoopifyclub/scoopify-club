import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/api-auth';

// POST: Save service rating and feedback, and trigger in-app notifications
export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { serviceId, rating, feedback } = await request.json();
  if (!serviceId || !rating) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  // Save rating to DB (assume ServiceRating table exists)
  await prisma.serviceRating.upsert({
    where: { serviceId },
    update: { rating, feedback, createdAt: new Date(), updatedAt: new Date() },
    create: { serviceId, customerId: user.userId, rating, feedback, createdAt: new Date(), updatedAt: new Date() },
  });
  // Mark service as rated (for dashboard UI)
  await prisma.service.update({ where: { id: serviceId }, data: { rated: true } });

  // In-app notifications (assume Notification table exists)
  // Notify admin
  await prisma.notification.create({
    data: {
      type: 'SERVICE_RATING',
      message: `Customer rated a service as ${rating}${rating === 'bad' && feedback ? ': ' + feedback : ''}`,
      userId: null, // null for admin/global
      serviceId,
      createdAt: new Date(),
      read: false,
      metadata: { rating, feedback },
    },
  });
  // Notify scooper (find employeeId from service)
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (service?.employeeId) {
    await prisma.notification.create({
      data: {
        type: 'SERVICE_RATING',
        message: `You received a new rating: ${rating}${rating === 'bad' && feedback ? ' - ' + feedback : ''}`,
        userId: service.employeeId,
        serviceId,
        createdAt: new Date(),
        read: false,
        metadata: { rating, feedback },
      },
    });
  }
  return NextResponse.json({ success: true });
}
