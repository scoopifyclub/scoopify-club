import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { addMinutes } from 'date-fns'
import { sendServiceNotificationEmail } from '@/lib/email'
import { checkTimeConflict } from '@/lib/validations'

export async function POST(
  request: Request,
  { params }: { params: { serviceId: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
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

    if (service.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Service is not available for claiming' },
        { status: 400 }
      )
    }

    // Check for time conflicts
    const userServices = await prisma.service.findMany({
      where: {
        employeeId: decoded.userId,
        status: {
          in: ['CLAIMED', 'ARRIVED', 'IN_PROGRESS']
        }
      }
    })

    if (checkTimeConflict(userServices, service, decoded.userId)) {
      return NextResponse.json(
        { error: 'You already have a service in progress' },
        { status: 400 }
      )
    }

    const updatedService = await prisma.service.update({
      where: { id: params.serviceId },
      data: {
        status: 'CLAIMED',
        employeeId: decoded.userId
      },
      include: {
        employee: true,
        customer: true,
        servicePlan: true
      }
    })

    return NextResponse.json(updatedService)
  } catch (error) {
    console.error('Error claiming service:', error)
    return NextResponse.json(
      { error: 'Failed to claim service' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { serviceId: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, role } = await verifyToken(token)
    if (role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employee = await prisma.employee.findUnique({
      where: { userId }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Extend the expiration time by 15 minutes
    const service = await prisma.service.update({
      where: {
        id: params.serviceId,
        employeeId: employee.id,
        status: 'CLAIMED'
      },
      data: {
        expiresAt: addMinutes(new Date(), 15)
      }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found or not claimed by you' }, { status: 404 })
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error('Extend service error:', error)
    return NextResponse.json({ error: 'Failed to extend service time' }, { status: 500 })
  }
} 