import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, role } = await verifyToken(token)
    if (role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const services = await prisma.service.findMany({
      where: {
        status: 'SCHEDULED',
        employeeId: null,
        scheduledFor: {
          gte: new Date()
        }
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
      },
      orderBy: {
        scheduledFor: 'asc'
      }
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('Available services error:', error)
    return NextResponse.json({ error: 'Failed to fetch available services' }, { status: 500 })
  }
} 