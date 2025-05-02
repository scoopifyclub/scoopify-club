import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/api-auth';

// POST: Mark a job as 'completed' (scooper submits checklist and photos)
export async function POST(request: Request) {
  // Define required checklist items
  const REQUIRED_ITEMS = [
    'gateClosed',
    'cornersChecked',
    'allWasteRemoved',
    'photosBefore',
    'photosAfter',
    'gatePhoto',
  ];
  const user = await getAuthUser(request);
  if (!user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await request.json();
  const { serviceId, checklist, beforePhotoIds, afterPhotoIds, gatePhotoId } = data;
  if (!serviceId || !checklist || !beforePhotoIds || !afterPhotoIds || !gatePhotoId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  // Checklist validation
  const checklistObj = typeof checklist === 'string' ? JSON.parse(checklist) : checklist;
  for (const item of REQUIRED_ITEMS) {
    if (item === 'photosBefore' && (!beforePhotoIds || beforePhotoIds.length < 4)) {
      return NextResponse.json({ error: 'At least 4 before photos required.' }, { status: 400 });
    }
    if (item === 'photosAfter' && (!afterPhotoIds || afterPhotoIds.length < 4)) {
      return NextResponse.json({ error: 'At least 4 after photos required.' }, { status: 400 });
    }
    if (item === 'gatePhoto' && !gatePhotoId) {
      return NextResponse.json({ error: 'Gate closed photo required.' }, { status: 400 });
    }
    if (["gateClosed","cornersChecked","allWasteRemoved"].includes(item) && !checklistObj[item]) {
      return NextResponse.json({ error: `Checklist item '${item}' is required.` }, { status: 400 });
    }
  }

  // Find the service and check if the user is assigned
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || service.employeeId !== user.userId) {
    return NextResponse.json({ error: 'Not authorized for this job' }, { status: 403 });
  }

  // Update service with checklist, photos, and status
  await prisma.service.update({
    where: { id: serviceId },
    data: {
      workflowStatus: 'COMPLETED',
      checklistCompleted: true,
      beforePhotoIds,
      afterPhotoIds,
      gatePhotoId,
    },
  });
  // Save checklist (could be in ServiceChecklist or as JSON on Service)
  await prisma.serviceChecklist.upsert({
    where: { serviceId },
    update: { items: checklist, completedAt: new Date() },
    create: { serviceId, items: checklist, completedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
  });
  // Optionally: trigger notification/email to customer and admin
  return NextResponse.json({ success: true });
}
