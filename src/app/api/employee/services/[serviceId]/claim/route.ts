import { NextResponse } from 'next/server'
import prisma from "@/lib/prisma";
import { verifyToken } from '@/lib/auth'
import { addMinutes } from 'date-fns'
import { sendServiceNotificationEmail } from '@/lib/email'
import { checkTimeConflict } from '@/lib/validations'

// API endpoint for employee to claim a service
export async function POST(
  request: Request,
  { params }: { params: { serviceId: string } }
) {
  try {
    // Verify employee authorization
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (payload.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the employee record
    const employee = await prisma.employee.findUnique({
      where: { userId: payload.userId },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee record not found' },
        { status: 404 }
      )
    }

    const { serviceId } = params

    // Check if the service exists and is available to claim
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        customer: {
          include: {
            user: true
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

    // Check if customer used a referral code when signing up
    const customer = await prisma.customer.findUnique({
      where: { id: service.customerId },
      include: {
        user: true,
        referredBy: {
          include: {
            user: true
          }
        }
      }
    });

    // Calculate payment splits
    const servicePrice = service.servicePlan.price;
    
    // Calculate stripe fees (approximately 2.9% + $0.30)
    const stripeFees = (servicePrice * 0.029) + 0.30;
    
    // Calculate net amount after stripe fees
    const netAmountAfterFees = servicePrice - stripeFees;
    
    // Base employee earnings: 75% of net amount after fees
    let potentialEarnings = netAmountAfterFees * 0.75;
    
    // Note: Referral payments are not processed during service claims
    // They are only processed during subscription payments

    // Claim the service - update the service record
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        employeeId: employee.id,
        status: 'CLAIMED',
        potentialEarnings,
        stripeFees, // Store the stripe fees for accounting purposes
        netAmount: netAmountAfterFees, // Store the net amount for accounting purposes
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            address: true,
          },
        },
        servicePlan: true,
      },
    })

    // Create a notification for the customer
    await prisma.notification.create({
      data: {
        userId: service.customer.userId,
        title: 'Service Claimed',
        message: `Your service scheduled for ${new Date(service.scheduledDate).toLocaleDateString()} has been claimed by a service provider.`,
        type: 'SERVICE_UPDATE',
        read: false,
      },
    })

    // Note: Referral payments are handled separately during subscription billing

    return NextResponse.json({
      message: 'Service claimed successfully',
      service: updatedService,
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