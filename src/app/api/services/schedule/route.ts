import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { date, serviceType, timeSlot } = body

    if (!date || !serviceType || !timeSlot) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const service = await prisma.service.create({
      data: {
        date: new Date(date),
        type: serviceType,
        timeSlot,
        status: 'scheduled',
        customer: {
          connect: {
            id: session.user.id
          }
        }
      }
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error('[SERVICE_SCHEDULE]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 