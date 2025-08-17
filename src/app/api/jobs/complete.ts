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

  // Decrement customer's service credits (but not below zero) and update creditsDepletedAt if needed
  const customerId = service.customerId;
  const updatedCustomer = await prisma.customer.update({
    where: { id: customerId },
    data: {
      serviceCredits: {
        decrement: 1
      }
    },
    select: { serviceCredits: true, creditsDepletedAt: true }
  });

  // If credits have just reached zero, set creditsDepletedAt
  if (updatedCustomer.serviceCredits === 0 && !updatedCustomer.creditsDepletedAt) {
    await prisma.customer.update({
      where: { id: customerId },
      data: { creditsDepletedAt: new Date() }
    });
  }
  // If credits are above zero, reset creditsDepletedAt
  if (updatedCustomer.serviceCredits > 0 && updatedCustomer.creditsDepletedAt) {
    await prisma.customer.update({
      where: { id: customerId },
      data: { creditsDepletedAt: null }
    });
  }
  
  // Optionally: if credits are low or zero, trigger notification/email to customer (future enhancement)

  // Notify customer by email that job is complete
  try {
    // Fetch customer info with user data and photos
    const customer = await prisma.customer.findUnique({ 
      where: { id: customerId },
      include: { user: true }
    });
    
    const beforePhotos = beforePhotoIds && beforePhotoIds.length
      ? await prisma.photo.findMany({ where: { id: { in: beforePhotoIds } } }) : [];
    const afterPhotos = afterPhotoIds && afterPhotoIds.length
      ? await prisma.photo.findMany({ where: { id: { in: afterPhotoIds } } }) : [];
    
    // Build photo HTML
    let photoHtml = '';
    if (afterPhotos.length) {
      photoHtml += '<h3>After Photos</h3>';
      photoHtml += '<div>' + afterPhotos.map(p => `<img src="${p.url}" alt="After" style="max-width:180px;margin:4px;"/>`).join('') + '</div>';
    }
    
    // Send email using the email service
    if (customer?.user?.email) {
      try {
        const { sendEmail } = await import('@/lib/email-service');
        await sendEmail(customer.user.email, 'service-completed', {
          customerName: customer.user.firstName || 'Customer',
          serviceId: serviceId,
          photoHtml: photoHtml
        });
      } catch (emailError) {
        console.error('Failed to send job completion email:', emailError);
        // Fallback to basic notification
        await prisma.notification.create({
          data: {
            userId: customer.userId,
            type: 'SERVICE_COMPLETE',
            title: 'Service Completed',
            message: 'Your service has been completed successfully!',
            createdAt: new Date(),
          },
        });
      }
    }
  } catch (err) {
    console.error('Failed to send job completion notification:', err);
  }

  return NextResponse.json({ success: true });
}
