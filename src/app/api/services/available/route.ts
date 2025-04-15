import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

export const GET = requireRole(['EMPLOYEE'])(async (request: NextRequest, user) => {
  try {
    const services = await prisma.service.findMany({
      where: {
        status: 'PENDING',
        preferredDay: {
          gte: new Date()
        }
      },
      include: {
        customer: {
          select: {
            user: {
              select: {
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('Error fetching available services:', error)
    return NextResponse.json(
      { message: 'Failed to fetch available services' },
      { status: 500 }
    )
  }
}) 