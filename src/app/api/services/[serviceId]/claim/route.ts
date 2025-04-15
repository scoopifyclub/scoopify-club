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

    // Check if service exists and is available
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        employee: true,
      },
    })

    if (!service) {
      return new NextResponse('Service not found', { status: 404 })
    }

    if (service.status !== 'PENDING') {
      return new NextResponse('Service is not available', { status: 400 })
    }

    if (service.employee) {
      return new NextResponse('Service is already claimed', { status: 400 })
    }

    // Update service with employee and status
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        status: 'CLAIMED',
        employee: {
          connect: {
            id: session.user.id,
          },
        },
      },
    })

    return NextResponse.json(updatedService)
  } catch (error) {
    console.error('Error claiming service:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 