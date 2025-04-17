import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    // Verify customer authorization
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { scheduledFor, serviceType, notes, numberOfDogs } = await request.json()

    // Validate required fields
    if (!scheduledFor || !serviceType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get customer details
    const customer = await prisma.customer.findFirst({
      where: { userId: decoded.id },
      include: {
        address: true,
        subscription: {
          include: {
            plan: true
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Validate service type against subscription
    if (serviceType === 'regular' && !customer.subscription) {
      return NextResponse.json(
        { error: 'Regular service requires an active subscription' },
        { status: 400 }
      )
    }

    // Find available employee in the service area
    const availableEmployee = await prisma.employee.findFirst({
      where: {
        serviceAreas: {
          some: {
            zipCode: customer.address.zipCode
          }
        },
        status: 'ACTIVE'
      }
    })

    if (!availableEmployee) {
      return NextResponse.json(
        { error: 'No available employee in your area' },
        { status: 400 }
      )
    }

    // Create the service
    const service = await prisma.service.create({
      data: {
        customerId: customer.id,
        employeeId: availableEmployee.id,
        scheduledFor: new Date(scheduledFor),
        status: 'SCHEDULED',
        type: serviceType,
        notes,
        numberOfDogs,
        address: {
          create: {
            street: customer.address.street,
            city: customer.address.city,
            state: customer.address.state,
            zipCode: customer.address.zipCode,
            latitude: customer.address.latitude,
            longitude: customer.address.longitude
          }
        }
      },
      include: {
        employee: {
          select: {
            name: true,
            phone: true
          }
        }
      }
    })

    // Create notification for employee
    await prisma.notification.create({
      data: {
        userId: availableEmployee.userId,
        type: 'NEW_SERVICE',
        title: 'New Service Assigned',
        message: `You have been assigned a new service on ${new Date(scheduledFor).toLocaleDateString()}`,
        data: { serviceId: service.id }
      }
    })

    return NextResponse.json({
      service,
      message: 'Service scheduled successfully'
    })
  } catch (error) {
    console.error('Error scheduling service:', error)
    return NextResponse.json(
      { error: 'Failed to schedule service' },
      { status: 500 }
    )
  }
} 