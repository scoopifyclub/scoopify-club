import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

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
    const { reason, type } = await request.json()

    // Verify the service exists and belongs to the employee
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        employeeId: session.user.id,
      },
    })

    if (!service) {
      return new NextResponse('Service not found', { status: 404 })
    }

    // Create the delay record
    const delay = await prisma.serviceDelay.create({
      data: {
        serviceId,
        reason,
        type,
        reportedById: session.user.id,
      },
    })

    // Update the service status
    await prisma.service.update({
      where: { id: serviceId },
      data: {
        status: 'DELAYED',
      },
    })

    // TODO: Send notification to customer about the delay

    return NextResponse.json(delay)
  } catch (error) {
    console.error('Error creating service delay:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 