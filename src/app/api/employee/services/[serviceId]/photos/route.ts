import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/auth';
import { validatePhotoUpload } from '@/lib/validations';
import sharp from 'sharp';

const MAX_PHOTOS_PER_SERVICE = 16;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const COMPRESSED_IMAGE_QUALITY = 80;
const COMPRESSED_IMAGE_WIDTH = 1920;

export async function POST(
  request: Request,
  { params }: { params: { serviceId: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const service = await prisma.service.findUnique({
      where: { id: params.serviceId },
      include: {
        photos: true
      }
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Validate photo upload
    const validation = validatePhotoUpload(
      service,
      decoded.userId,
      decoded.role === 'ADMIN'
    );

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { photos } = await request.json();

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json(
        { error: 'At least one photo is required' },
        { status: 400 }
      );
    }

    if (service.photos.length + photos.length > MAX_PHOTOS_PER_SERVICE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PHOTOS_PER_SERVICE} photos allowed per service` },
        { status: 400 }
      );
    }

    const processedPhotos = await Promise.all(
      photos.map(async (photo) => {
        if (!photo.base64 || !photo.type) {
          throw new Error('Invalid photo data');
        }

        // Validate base64 format
        if (!photo.base64.startsWith('data:image/')) {
          throw new Error('Invalid image format');
        }

        // Convert base64 to buffer
        const base64Data = photo.base64.split(',')[1];
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Check image size
        if (imageBuffer.length > MAX_IMAGE_SIZE) {
          throw new Error('Image size exceeds 5MB limit');
        }

        // Process image with sharp
        const processedImage = await sharp(imageBuffer)
          .resize(COMPRESSED_IMAGE_WIDTH, null, {
            withoutEnlargement: true,
            fit: 'inside'
          })
          .jpeg({ quality: COMPRESSED_IMAGE_QUALITY })
          .toBuffer();

        return {
          type: photo.type,
          data: `data:image/jpeg;base64,${processedImage.toString('base64')}`,
          latitude: photo.latitude,
          longitude: photo.longitude,
          timestamp: photo.timestamp
        };
      })
    );

    const updatedService = await prisma.service.update({
      where: { id: params.serviceId },
      data: {
        photos: {
          create: processedPhotos.map(photo => ({
            type: photo.type,
            url: photo.data,
            latitude: photo.latitude,
            longitude: photo.longitude,
            timestamp: photo.timestamp
          }))
        }
      },
      include: {
        photos: true
      }
    });

    return NextResponse.json({
      ...updatedService,
      remainingPhotoSlots: MAX_PHOTOS_PER_SERVICE - updatedService.photos.length
    });
  } catch (error) {
    console.error('Error uploading photos:', error);
    return NextResponse.json(
      { error: 'Failed to upload photos' },
      { status: 500 }
    );
  }
}

// Add GET endpoint to retrieve photos for a service
export async function GET(
  request: Request,
  { params }: { params: { serviceId: string } }
) {
  try {
    // Verify authorization (employee or admin)
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'EMPLOYEE' && decoded.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get photos for the service
    const photos = await prisma.servicePhoto.findMany({
      where: { serviceId: params.serviceId },
      orderBy: { timestamp: 'desc' }
    });

    return NextResponse.json({
      photos,
      remainingSlots: MAX_PHOTOS_PER_SERVICE - photos.length
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 