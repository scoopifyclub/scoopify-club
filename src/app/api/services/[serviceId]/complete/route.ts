import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import prisma from "@/lib/prisma";


import { sendServiceNotificationEmail } from '@/lib/email';
import { PhotoType } from '@prisma/client';
import sharp from 'sharp';
import { validateServiceCompletion } from '@/lib/validations';
import { addDays } from 'date-fns';

const MAX_PHOTOS_PER_SERVICE = 16;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const COMPRESSED_IMAGE_QUALITY = 80;
const COMPRESSED_IMAGE_WIDTH = 1920;
const PHOTO_RETENTION_DAYS = 7; // Photos will be deleted after this many days

export async function POST(
  request: Request,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    // Verify employee or admin authorization
    // Get access token from cookies
const cookieStore = await cookies();
const accessToken = cookieStore.get('accessToken')?.value;

if (!accessToken) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Validate the token and check role
const { userId, role } = await validateUser(accessToken);
    if (!session?.user || (role !== 'EMPLOYEE' && role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = await prisma.service.findUnique({
      where: { id: (await params).serviceId },
      include: {
        employee: true,
        customer: {
          include: {
            user: true,
            address: true
          }
        },
        servicePlan: true,
        photos: true
      }
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Validate service completion based on user role
    const validation = validateServiceCompletion(
      service,
      userId,
      role === 'ADMIN'
    );

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Get request body
    const { notes, photos } = await request.json();

    // Check current photo count
    const currentPhotoCount = await prisma.servicePhoto.count({
      where: { serviceId: (await params).serviceId }
    });

    // Check if adding these photos would exceed the limit
    if (photos && photos.length > 0 && currentPhotoCount + photos.length > MAX_PHOTOS_PER_SERVICE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PHOTOS_PER_SERVICE} photos allowed per service` },
        { status: 400 }
      );
    }

    // Process and compress new photos if provided
    let compressedPhotos = [];
    if (photos && photos.length > 0) {
      compressedPhotos = await Promise.all(
        photos.map(async (photoData: { base64: string; type: PhotoType }) => {
          if (!photoData.base64 || !photoData.type) {
            throw new Error('Invalid photo data: missing base64 or type');
          }

          // Extract base64 data
          const base64Data = photoData.base64.split(',')[1];
          if (!base64Data) {
            throw new Error('Invalid base64 format');
          }

          // Convert base64 to buffer
          const imageBuffer = Buffer.from(base64Data, 'base64');

          // Check image size
          if (imageBuffer.length > MAX_IMAGE_SIZE) {
            throw new Error('Image size exceeds 5MB limit');
          }

          // Compress image
          const compressedBuffer = await sharp(imageBuffer)
            .resize(COMPRESSED_IMAGE_WIDTH, null, {
              withoutEnlargement: true,
              fit: 'inside'
            })
            .jpeg({ quality: COMPRESSED_IMAGE_QUALITY })
            .toBuffer();

          // Convert back to base64
          return {
            url: `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`,
            type: photoData.type,
            expiresAt: addDays(new Date(), PHOTO_RETENTION_DAYS) // Set expiration date for photo cleanup
          };
        })
      );
    }

    // Update service status to COMPLETED
    const updatedService = await prisma.service.update({
      where: { id: (await params).serviceId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        notes,
        // Add new photos if provided
        ...(compressedPhotos.length > 0 && {
          photos: {
            create: compressedPhotos.map(photo => ({
              url: photo.url,
              type: photo.type,
              expiresAt: photo.expiresAt
            }))
          }
        })
      },
      include: {
        employee: true,
        customer: {
          include: {
            user: true,
            address: true
          }
        },
        servicePlan: true,
        photos: true
      }
    });

    // Organize photos for email
    const beforePhotos = updatedService.photos
      .filter(photo => photo.type === 'BEFORE')
      .map(photo => photo.url);

    const afterPhotos = updatedService.photos
      .filter(photo => photo.type === 'AFTER')
      .map(photo => photo.url);

    // Send completion notification to customer
    await sendServiceNotificationEmail(
      updatedService.customer.user.email,
      updatedService.id,
      'completed',
      {
        date: updatedService.scheduledDate.toLocaleDateString(),
        address: `${updatedService.customer.address?.street || ''}, ${updatedService.customer.address?.city || ''}`,
        employeeName: updatedService.employee?.name || 'Your service provider',
        notes: notes || undefined,
        photoUrls: {
          before: beforePhotos,
          after: afterPhotos
        }
      }
    );

    // Schedule photo deletion - Create a record in the cleanup queue
    await prisma.cleanupTask.create({
      data: {
        taskType: 'PHOTO_CLEANUP',
        scheduledFor: addDays(new Date(), PHOTO_RETENTION_DAYS),
        targetId: (await params).serviceId,
        status: 'PENDING'
      }
    });

    return NextResponse.json({
      message: 'Service completed successfully',
      service: {
        ...updatedService,
        photoUrls: {
          before: beforePhotos,
          after: afterPhotos
        },
        photoRetentionDays: PHOTO_RETENTION_DAYS
      }
    });
  } catch (error) {
    console.error('Error completing service:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to complete service' },
      { status: 500 }
    );
  }
} 