import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get all pending services that are within 24 hours of their preferred day
    const now = new Date()
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const services = await prisma.service.findMany({
      where: {
        status: 'PENDING',
        preferredDay: {
          lte: twentyFourHoursFromNow,
        },
      },
      include: {
        customer: {
          select: {
            address: true,
            coordinates: true,
          },
        },
        subscription: {
          select: {
            price: true,
          },
        },
      },
    })

    // Transform the services to include the necessary information
    const transformedServices = services.map((service) => ({
      id: service.id,
      address: service.customer.address,
      preferredDay: service.preferredDay.toISOString(),
      status: service.status,
      paymentAmount: service.subscription.price * 0.75, // 75% of subscription price
      createdAt: service.createdAt.toISOString(),
      coordinates: service.customer.coordinates,
    }))

    return NextResponse.json(transformedServices)
  } catch (error) {
    console.error('Error fetching available services:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 