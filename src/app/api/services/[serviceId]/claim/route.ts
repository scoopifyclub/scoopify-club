import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prismaClient = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { serviceId } = params

    // Get the service
    const service = await prismaClient.service.findUnique({
      where: { id: serviceId },
      include: { customer: true },
    })

    if (!service) {
      return NextResponse.json(
        { message: 'Service not found' },
        { status: 404 }
      )
    }

    if (service.status !== 'SCHEDULED') {
      return NextResponse.json(
        { message: 'Service is not available for claiming' },
        { status: 400 }
      )
    }

    // Check if service is already claimed
    if (service.employeeId) {
      return NextResponse.json(
        { message: 'Service already claimed' },
        { status: 400 }
      )
    }

    // Update service status and set claim time
    const updatedService = await prismaClient.service.update({
      where: { id: serviceId },
      data: {
        status: 'CLAIMED',
        employeeId: session.user.id,
        claimedAt: new Date(),
      },
      include: {
        customer: true,
        checklist: true,
      },
    })

    // Create notification for customer
    await prismaClient.notification.create({
      data: {
        userId: service.customer.userId,
        type: 'JOB_CLAIMED',
        title: 'Service Claimed',
        message: `An employee has claimed your service scheduled for ${new Date(service.scheduledFor).toLocaleDateString()}`,
      },
    })

    return NextResponse.json(updatedService)
  } catch (error) {
    console.error('Claim service error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Add a route to check if a claimed service has expired
export async function GET(
  req: Request,
  { params }: { params: { serviceId: string } }
) {
  try {
    const { serviceId } = params

    const service = await prismaClient.service.findUnique({
      where: { id: serviceId },
    })

    if (!service) {
      return NextResponse.json(
        { message: 'Service not found' },
        { status: 404 }
      )
    }

    if (service.status === 'CLAIMED' && service.claimedAt) {
      const claimedTime = new Date(service.claimedAt).getTime()
      const currentTime = new Date().getTime()
      const minutesElapsed = (currentTime - claimedTime) / (1000 * 60)

      if (minutesElapsed > 45) {
        // Service has expired, update status
        await prismaClient.service.update({
          where: { id: serviceId },
          data: {
            status: 'EXPIRED',
            employeeId: null,
            claimedAt: null,
          },
        })

        return NextResponse.json({ expired: true })
      }

      return NextResponse.json({
        expired: false,
        minutesRemaining: Math.max(0, Math.ceil(45 - minutesElapsed)),
      })
    }

    return NextResponse.json({ expired: false })
  } catch (error) {
    console.error('Check service expiration error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 