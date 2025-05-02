import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/api-auth';

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { employeeId } = await request.json();
    if (!employeeId) {
      return NextResponse.json({ error: 'Missing employeeId' }, { status: 400 });
    }

    if (employeeId === 'ALL') {
      // Find all scoopers who have NOT completed onboarding
      const incomplete = await prisma.employee.findMany({
        where: {
          role: 'EMPLOYEE',
          OR: [
            { hasSetServiceArea: false },
            { serviceAreas: { none: {} } }
          ]
        },
        select: { userId: true }
      });
      if (incomplete.length === 0) {
        return NextResponse.json({ success: false, message: 'No incomplete scoopers found.' });
      }
      // Create notifications in bulk
      await prisma.notification.createMany({
        data: incomplete.map(emp => ({
          userId: emp.userId,
          type: 'ONBOARDING_REMINDER',
          title: 'Complete Your Onboarding',
          message: 'Please complete your onboarding by setting up at least one active service area.',
          read: false
        })),
        skipDuplicates: true
      });
      return NextResponse.json({ success: true, count: incomplete.length });
    }

    // Single reminder fallback
    await prisma.notification.create({
      data: {
        userId: employeeId,
        type: 'ONBOARDING_REMINDER',
        title: 'Complete Your Onboarding',
        message: 'Please complete your onboarding by setting up at least one active service area.',
        read: false
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send onboarding reminder:', error);
    return NextResponse.json({ error: 'Failed to send onboarding reminder' }, { status: 500 });
  }
}
