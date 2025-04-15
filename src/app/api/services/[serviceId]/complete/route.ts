import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: { serviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { serviceId } = params
    const { checklist, photos } = await request.json()

    // Check if service exists and is in progress
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        employee: true,
        checklist: true,
        photos: true,
      },
    })

    if (!service) {
      return new NextResponse('Service not found', { status: 404 })
    }

    if (service.status !== 'IN_PROGRESS') {
      return new NextResponse('Service is not in progress', { status: 400 })
    }

    if (service.employee?.id !== session.user.id) {
      return new NextResponse('You are not assigned to this service', { status: 403 })
    }

    // Verify checklist is complete
    if (!service.checklist || !service.checklist.cornersCleaned || 
        !service.checklist.wasteDisposed || !service.checklist.areaRaked || 
        !service.checklist.gateClosed) {
      return new NextResponse('Checklist is not complete', { status: 400 })
    }

    // Verify all required photos are uploaded
    const requiredPhotoTypes = [
      'BEFORE_CORNER1', 'BEFORE_CORNER2', 'BEFORE_CORNER3', 'BEFORE_CORNER4',
      'AFTER_CORNER1', 'AFTER_CORNER2', 'AFTER_CORNER3', 'AFTER_CORNER4'
    ];
    const uploadedPhotoTypes = service.photos.map(photo => photo.type);
    const missingPhotos = requiredPhotoTypes.filter(type => !uploadedPhotoTypes.includes(type));
    
    if (missingPhotos.length > 0) {
      return new NextResponse('Missing required photos', { status: 400 })
    }

    // Update service status to completed
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })

    // Create payment record for the employee
    await prisma.payment.create({
      data: {
        employeeId: session.user.id,
        serviceId: serviceId,
        amount: service.paymentAmount,
        status: 'PENDING',
        type: 'SERVICE',
      },
    })

    // TODO: Send notification to customer about completed service
    // TODO: Send notification to admin about completed service

    return NextResponse.json(updatedService)
  } catch (error) {
    console.error('Error completing service:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 