import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
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

    const { scheduledDate } = await request.json()

    if (!scheduledDate) {
      return new NextResponse('Scheduled date is required', { status: 400 })
    }

    const service = await prisma.service.findUnique({
      where: { id: params.serviceId },
      include: {
        customer: true,
        employee: true,
      },
    })

    if (!service) {
      return new NextResponse('Service not found', { status: 404 })
    }

    if (service.status !== 'AVAILABLE') {
      return new NextResponse('Service is not available for scheduling', { status: 400 })
    }

    // Check for scheduling conflicts
    const conflictingService = await prisma.service.findFirst({
      where: {
        OR: [
          {
            employeeId: service.employeeId,
            scheduledDate: {
              lte: new Date(scheduledDate),
            },
            scheduledEndDate: {
              gte: new Date(scheduledDate),
            },
          },
          {
            employeeId: service.employeeId,
            scheduledDate: {
              lte: new Date(new Date(scheduledDate).getTime() + service.duration * 60000),
            },
            scheduledEndDate: {
              gte: new Date(new Date(scheduledDate).getTime() + service.duration * 60000),
            },
          },
        ],
        NOT: {
          id: service.id,
        },
      },
    })

    if (conflictingService) {
      return new NextResponse('Employee is already scheduled for this time', { status: 400 })
    }

    // Update service with scheduled date
    const updatedService = await prisma.service.update({
      where: { id: params.serviceId },
      data: {
        scheduledDate: new Date(scheduledDate),
        scheduledEndDate: new Date(new Date(scheduledDate).getTime() + service.duration * 60000),
        status: 'SCHEDULED',
      },
      include: {
        customer: true,
        employee: true,
      },
    })

    return NextResponse.json(updatedService)
  } catch (error) {
    console.error('Service scheduling error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { serviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { scheduledDate } = await request.json()

    if (!scheduledDate) {
      return new NextResponse('Scheduled date is required', { status: 400 })
    }

    const service = await prisma.service.findUnique({
      where: { id: params.serviceId },
      include: {
        customer: true,
        employee: true,
      },
    })

    if (!service) {
      return new NextResponse('Service not found', { status: 404 })
    }

    if (service.status !== 'SCHEDULED') {
      return new NextResponse('Service is not scheduled', { status: 400 })
    }

    // Check for scheduling conflicts
    const conflictingService = await prisma.service.findFirst({
      where: {
        OR: [
          {
            employeeId: service.employeeId,
            scheduledDate: {
              lte: new Date(scheduledDate),
            },
            scheduledEndDate: {
              gte: new Date(scheduledDate),
            },
          },
          {
            employeeId: service.employeeId,
            scheduledDate: {
              lte: new Date(new Date(scheduledDate).getTime() + service.duration * 60000),
            },
            scheduledEndDate: {
              gte: new Date(new Date(scheduledDate).getTime() + service.duration * 60000),
            },
          },
        ],
        NOT: {
          id: service.id,
        },
      },
    })

    if (conflictingService) {
      return new NextResponse('Employee is already scheduled for this time', { status: 400 })
    }

    // Update service with new scheduled date
    const updatedService = await prisma.service.update({
      where: { id: params.serviceId },
      data: {
        scheduledDate: new Date(scheduledDate),
        scheduledEndDate: new Date(new Date(scheduledDate).getTime() + service.duration * 60000),
      },
      include: {
        customer: true,
        employee: true,
      },
    })

    return NextResponse.json(updatedService)
  } catch (error) {
    console.error('Service rescheduling error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { serviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const service = await prisma.service.findUnique({
      where: { id: params.serviceId },
    })

    if (!service) {
      return new NextResponse('Service not found', { status: 404 })
    }

    if (service.status !== 'SCHEDULED') {
      return new NextResponse('Service is not scheduled', { status: 400 })
    }

    // Cancel service scheduling
    const updatedService = await prisma.service.update({
      where: { id: params.serviceId },
      data: {
        scheduledDate: null,
        scheduledEndDate: null,
        status: 'AVAILABLE',
      },
    })

    return NextResponse.json(updatedService)
  } catch (error) {
    console.error('Service cancellation error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 