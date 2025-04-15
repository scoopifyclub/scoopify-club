import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const services = await prisma.service.findMany({
      where: {
        customerId: session.user.id
      },
      orderBy: {
        date: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    const total = await prisma.service.count({
      where: {
        customerId: session.user.id
      }
    })

    return NextResponse.json({
      services,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('[SERVICE_HISTORY]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 