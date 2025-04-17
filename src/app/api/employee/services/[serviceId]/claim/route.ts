import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { addMinutes } from 'date-fns'

export async function POST(
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

    // Check if service is already claimed
    const existingService = await prisma.service.findUnique({
      where: { id: params.serviceId },
      select: { status: true, employeeId: true }
    })

    if (existingService?.status === 'CLAIMED' && existingService.employeeId !== employee.id) {
      return NextResponse.json({ error: 'Service already claimed by another employee' }, { status: 409 })
    }

    // Calculate expiration time (45 minutes from now)
    const expiresAt = addMinutes(new Date(), 45)

    const service = await prisma.service.update({
      where: {
        id: params.serviceId,
        status: 'SCHEDULED',
        employeeId: null
      },
      data: {
        status: 'CLAIMED',
        employeeId: employee.id,
        claimedAt: new Date(),
        expiresAt
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
            address: true,
            gateCode: true
          }
        }
      }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not available' }, { status: 404 })
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error('Claim service error:', error)
    return NextResponse.json({ error: 'Failed to claim service' }, { status: 500 })
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