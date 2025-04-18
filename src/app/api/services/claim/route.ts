import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { isWithinInterval, addDays, setHours, setMinutes } from 'date-fns'

export async function POST(request: Request) {
  try {
    // Verify employee authorization
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { serviceId } = await request.json()

    if (!serviceId) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      )
    }

    // Get employee details
    const employee = await prisma.employee.findFirst({
      where: { userId: decoded.id }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Get the service
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        customer: {
          include: {
            address: true
          }
        }
      }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    if (service.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Service is not available for claiming' },
        { status: 400 }
      )
    }

    // Check if employee is in the service area
    const isInServiceArea = await prisma.serviceArea.findFirst({
      where: {
        employeeId: employee.id,
        zipCode: service.customer.address.zipCode
      }
    })

    if (!isInServiceArea) {
      return NextResponse.json(
        { error: 'You are not assigned to this service area' },
        { status: 400 }
      )
    }

    // Get current time in local timezone
    const now = new Date()
    const serviceDate = new Date(service.scheduledDate)
    
    // Calculate claiming window
    const dayBeforeService = addDays(serviceDate, -1)
    const claimingStart = setHours(dayBeforeService, 18) // 6 PM
    const claimingEnd = setHours(serviceDate, 19) // 7 PM
    
    // Check if current time is within claiming window
    const isWithinClaimingWindow = isWithinInterval(now, {
      start: claimingStart,
      end: claimingEnd
    })

    if (!isWithinClaimingWindow) {
      return NextResponse.json(
        { 
          error: 'Services can only be claimed between 6 PM the day before and 7 PM on the service day',
          nextAvailableTime: claimingStart.toISOString()
        },
        { status: 400 }
      )
    }

    // Check if service is within scooping hours (7 AM - 7 PM)
    const scoopingStart = setHours(serviceDate, 7) // 7 AM
    const scoopingEnd = setHours(serviceDate, 19) // 7 PM
    
    const isWithinScoopingHours = isWithinInterval(serviceDate, {
      start: scoopingStart,
      end: scoopingEnd
    })

    if (!isWithinScoopingHours) {
      return NextResponse.json(
        { 
          error: 'Scooping services are only available between 7 AM and 7 PM',
          nextAvailableTime: scoopingStart.toISOString()
        },
        { status: 400 }
      )
    }

    // Update service status and assign employee
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        status: 'CLAIMED',
        employeeId: employee.id,
        claimedAt: new Date()
      },
      include: {
        customer: {
          include: {
            address: true
          }
        }
      }
    })

    // Create notification for customer
    await prisma.notification.create({
      data: {
        userId: service.customer.userId,
        type: 'JOB_CLAIMED',
        title: 'Service Claimed',
        message: `An employee has claimed your service scheduled for ${new Date(service.scheduledDate).toLocaleDateString()}`,
        data: { serviceId: service.id }
      }
    })

    return NextResponse.json({
      service: updatedService,
      message: 'Service claimed successfully'
    })
  } catch (error) {
    console.error('Service claiming error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 