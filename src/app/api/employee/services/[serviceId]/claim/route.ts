import { NextResponse } from 'next/server'
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/auth'
import { addMinutes, setHours, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns'
import { sendServiceNotificationEmail } from '@/lib/email'
import { checkTimeConflict } from '@/lib/validations'

// API endpoint for employee to claim a service
export async function POST(
  request: Request,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    // Verify employee authorization
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current time is between 7am and 7pm
    const now = new Date();
    const today = new Date();
    const sevenAM = setHours(startOfDay(today), 7);
    const sevenPM = setHours(startOfDay(today), 19);

    if (isBefore(now, sevenAM) || isAfter(now, sevenPM)) {
      return NextResponse.json(
        { error: 'Services can only be claimed between 7:00 AM and 7:00 PM' },
        { status: 400 }
      )
    }

    // Get the employee record
    const employee = await prisma.employee.findUnique({
      where: { userId: payload.userId },
      include: {
        services: {
          where: {
            scheduledDate: {
              gte: startOfDay(today),
              lt: endOfDay(today)
            },
            status: {
              in: ['ASSIGNED', 'IN_PROGRESS']
            }
          }
        },
        serviceAreas: true
      }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee record not found' },
        { status: 404 }
      )
    }

    // Check if employee already has a claimed service for today
    if (employee.services.length > 0) {
      return NextResponse.json(
        { error: 'You already have an active service. Complete it before claiming another.' },
        { status: 400 }
      )
    }

    const { serviceId } = params

    // Check if the service exists and is available to claim
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        customer: {
          include: {
            user: true,
            address: true
          }
        },
        servicePlan: true,
      },
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    if (service.employeeId) {
      return NextResponse.json(
        { error: 'Service already claimed by another employee' },
        { status: 409 }
      )
    }

    if (service.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Service is not available for claiming' },
        { status: 400 }
      )
    }

    // Verify service is in employee's service area
    const customerZipCode = service.customer.address?.zipCode;
    if (!customerZipCode) {
      return NextResponse.json(
        { error: 'Customer address information is incomplete' },
        { status: 400 }
      )
    }

    const isInServiceArea = employee.serviceAreas.some(
      area => area.zipCode === customerZipCode
    );

    if (!isInServiceArea) {
      return NextResponse.json(
        { error: 'This service is outside your service area' },
        { status: 400 }
      )
    }

    // Set arrival deadline (2 hours from claiming)
    const arrivalDeadline = addMinutes(new Date(), 120);

    // Claim the service
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        employeeId: employee.id,
        status: 'ASSIGNED',
        claimedAt: new Date(),
        arrivalDeadline
      },
      include: {
        customer: {
          include: {
            user: true,
            address: true
          }
        },
        servicePlan: true
      }
    })

    // Send notification to customer
    try {
      await sendServiceNotificationEmail(
        updatedService.customer.user.email,
        updatedService.id,
        'claimed',
        {
          date: updatedService.scheduledDate.toLocaleDateString(),
          address: `${updatedService.customer.address?.street || ''}, ${updatedService.customer.address?.city || ''}`,
          employeeName: employee.name || 'Your service provider'
        }
      )
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError)
      // Continue with the response even if email fails
    }

    return NextResponse.json({
      message: 'Service claimed successfully',
      service: updatedService
    })
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
  { params }: { params: Promise<{ serviceId: string }> }
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
        id: (await params).serviceId,
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