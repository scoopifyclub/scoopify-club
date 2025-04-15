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
    const { checklist, notes } = await request.json()

    // Check if service exists and is in progress
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        employee: true,
        checklist: true,
      },
    })

    if (!service) {
      return new NextResponse('Service not found', { status: 404 })
    }

    if (service.status !== 'IN_PROGRESS') {
      return new NextResponse('Service is not in progress', { status: 400 })
    }

    if (service.employee?.id !== session.user.id) {
      return new NextResponse('You are not assigned to this service', { status: 403 })
    }

    // Update or create checklist
    const updatedChecklist = await prisma.serviceChecklist.upsert({
      where: { serviceId },
      update: {
        ...checklist,
        notes,
      },
      create: {
        serviceId,
        ...checklist,
        notes,
      },
    })

    return NextResponse.json(updatedChecklist)
  } catch (error) {
    console.error('Error updating checklist:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 