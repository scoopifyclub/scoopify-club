import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { serviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { status } = await request.json()
    const { serviceId } = params

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

    // Update the service status
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: { status },
      include: {
        customer: {
          include: {
            user: true,
            address: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: updatedService.id,
      customerName: updatedService.customer.user.name,
      address: updatedService.customer.address
        ? `${updatedService.customer.address.street}, ${updatedService.customer.address.city}, ${updatedService.customer.address.state} ${updatedService.customer.address.zipCode}`
        : 'No address provided',
      numberOfDogs: updatedService.numberOfDogs,
      date: updatedService.date,
      status: updatedService.status,
    })
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json(
      { error: 'Failed to update service status' },
      { status: 500 }
    )
  }
} 