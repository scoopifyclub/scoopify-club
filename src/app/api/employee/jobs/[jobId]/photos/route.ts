import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    // Verify employee authorization
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the service
    const service = await prisma.service.findUnique({
      where: { id: params.jobId }
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Verify employee owns this job
    if (service.employeeId !== decoded.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify service is in progress
    if (service.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Service must be in progress to upload photos' },
        { status: 400 }
      );
    }

    const { photos, checklistItems, isComplete, gateChecked } = await request.json();

    // Validate photos
    if (!photos || !Array.isArray(photos)) {
      return NextResponse.json(
        { error: 'Photos are required' },
        { status: 400 }
      );
    }

    // Validate required number of photos
    const beforePhotos = photos.filter(p => p.type === 'BEFORE');
    const afterPhotos = photos.filter(p => p.type === 'AFTER');

    if (beforePhotos.length < 4 || afterPhotos.length < 4) {
      return NextResponse.json(
        { error: 'At least 4 before and 4 after photos are required' },
        { status: 400 }
      );
    }

    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Save photos
      const savedPhotos = await Promise.all(
        photos.map(photo =>
          tx.servicePhoto.create({
            data: {
              serviceId: params.jobId,
              url: photo.url,
              type: photo.type,
              metadata: photo.metadata || {}
            }
          })
        )
      );

      // Save checklist items
      if (checklistItems && Array.isArray(checklistItems)) {
        await Promise.all(
          checklistItems.map(item =>
            tx.serviceChecklist.create({
              data: {
                serviceId: params.jobId,
                item: item.text,
                completed: item.completed
              }
            })
          )
        );
      }

      // Update service status if complete
      if (isComplete) {
        const updatedService = await tx.service.update({
          where: { id: params.jobId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            gateChecked: gateChecked || false
          }
        });

        // Create notification for customer
        await tx.notification.create({
          data: {
            userId: service.customerId,
            type: 'SERVICE_COMPLETED',
            title: 'Service Completed',
            message: 'Your yard service has been completed! You can now view the before and after photos.',
            data: {
              serviceId: service.id,
              photoCount: savedPhotos.length
            }
          }
        });

        return updatedService;
      }

      return service;
    });

    return NextResponse.json({
      message: isComplete ? 'Service completed successfully' : 'Photos uploaded successfully',
      service: result
    });
  } catch (error) {
    console.error('Error uploading photos:', error);
    return NextResponse.json(
      { error: 'Failed to upload photos' },
      { status: 500 }
    );
  }
}

// Get photos for a service
export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    // Verify authorization
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the service with photos and checklist
    const service = await prisma.service.findUnique({
      where: { id: params.jobId },
      include: {
        photos: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        checklist: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Verify authorization
    if (
      decoded.role === 'EMPLOYEE' && service.employeeId !== decoded.id ||
      decoded.role === 'CUSTOMER' && service.customerId !== decoded.id
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      photos: service.photos,
      checklist: service.checklist,
      gateChecked: service.gateChecked
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
} 