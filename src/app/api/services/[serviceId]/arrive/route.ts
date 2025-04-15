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

    // Check if service exists and is claimed by the current employee
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        employee: true,
      },
    })

    if (!service) {
      return new NextResponse('Service not found', { status: 404 })
    }

    if (service.status !== 'CLAIMED') {
      return new NextResponse('Service is not claimed', { status: 400 })
    }

    if (service.employee?.id !== session.user.id) {
      return new NextResponse('You are not assigned to this service', { status: 403 })
    }

    // Check if employee is within 45 minutes of arrival deadline
    const now = new Date()
    const arrivalDeadline = new Date(service.arrivalDeadline || '')
    const timeUntilDeadline = arrivalDeadline.getTime() - now.getTime()
    const minutesUntilDeadline = timeUntilDeadline / (1000 * 60)

    if (minutesUntilDeadline < -45) {
      return new NextResponse('Service is too late to start', { status: 400 })
    }

    // Update service status to in progress
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        status: 'IN_PROGRESS',
      },
    })

    // TODO: Send notification to customer about service starting

    return NextResponse.json(updatedService)
  } catch (error) {
    console.error('Error confirming arrival:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 