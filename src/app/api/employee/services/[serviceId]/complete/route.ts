import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { sendServiceNotificationEmail } from '@/lib/email'
import sharp from 'sharp'
import { PhotoType } from '@prisma/client'
import { validateServiceCompletion } from '@/lib/validations'

const MAX_PHOTOS_PER_SERVICE = 16
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const COMPRESSED_IMAGE_QUALITY = 80
const COMPRESSED_IMAGE_WIDTH = 1920

export async function POST(
  request: Request,
  { params }: { params: { serviceId: string } }
) {
  try {
    // Verify employee authorization
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const service = await prisma.service.findUnique({
      where: { id: params.serviceId },
      include: {
        employee: true,
        customer: true,
        servicePlan: true
      }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Validate service completion
    const validation = validateServiceCompletion(
      service,
      decoded.userId,
      decoded.role === 'ADMIN'
    )

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Get request body
    const { notes, photos } = await request.json()

    // Check current photo count
    const currentPhotoCount = await prisma.servicePhoto.count({
      where: { serviceId: params.serviceId }
    })

    // Check if adding these photos would exceed the limit
    if (photos && photos.length > 0 && currentPhotoCount + photos.length > MAX_PHOTOS_PER_SERVICE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PHOTOS_PER_SERVICE} photos allowed per service` },
        { status: 400 }
      )
    }

    // Check if service has at least one photo
    const existingPhotos = await prisma.servicePhoto.findMany({
      where: { serviceId: params.serviceId }
    })

    if (existingPhotos.length === 0 && (!photos || photos.length === 0)) {
      return NextResponse.json(
        { error: 'At least one photo is required to complete the service' },
        { status: 400 }
      )
    }

    // Process and compress new photos if provided
    let compressedPhotos = []
    if (photos && photos.length > 0) {
      compressedPhotos = await Promise.all(
        photos.map(async (photoData: { base64: string; type: PhotoType }) => {
          if (!photoData.base64 || !photoData.type) {
            throw new Error('Invalid photo data: missing base64 or type')
          }

          // Extract base64 data
          const base64Data = photoData.base64.split(',')[1]
          if (!base64Data) {
            throw new Error('Invalid base64 format')
          }

          // Convert base64 to buffer
          const imageBuffer = Buffer.from(base64Data, 'base64')

          // Check image size
          if (imageBuffer.length > MAX_IMAGE_SIZE) {
            throw new Error('Image size exceeds 5MB limit')
          }

          // Compress image
          const compressedBuffer = await sharp(imageBuffer)
            .resize(COMPRESSED_IMAGE_WIDTH, null, {
              withoutEnlargement: true,
              fit: 'inside'
            })
            .jpeg({ quality: COMPRESSED_IMAGE_QUALITY })
            .toBuffer()

          // Convert back to base64
          return {
            url: `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`,
            type: photoData.type
          }
        })
      )
    }

    // Update service status to COMPLETED
    const updatedService = await prisma.service.update({
      where: { id: params.serviceId },
      data: {
        status: 'COMPLETED',
        completedDate: new Date(),
        notes,
        // Add new photos if provided
        ...(compressedPhotos.length > 0 && {
          photos: {
            create: compressedPhotos.map(photo => ({
              url: photo.url,
              type: photo.type
            }))
          }
        })
      },
      include: {
        employee: true,
        customer: true,
        servicePlan: true,
        photos: true
      }
    })

    if (!updatedService) {
      return NextResponse.json(
        { error: 'Service not found or not assigned to you' },
        { status: 404 }
      )
    }

    // Send completion notification to customer
    await sendServiceNotificationEmail(
      updatedService.customer.user.email,
      updatedService.id,
      'completed',
      {
        date: updatedService.scheduledDate.toLocaleDateString(),
        time: updatedService.scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        address: updatedService.customer.address?.street || 'No address provided',
        serviceName: updatedService.servicePlan.name,
        notes: notes || 'No additional notes provided',
        photoCount: updatedService.photos.length
      }
    )

    return NextResponse.json({
      ...updatedService,
      remainingPhotoSlots: MAX_PHOTOS_PER_SERVICE - updatedService.photos.length
    })
  } catch (error) {
    console.error('Error completing service:', error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to complete service' },
      { status: 500 }
    )
  }
} 