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

    const employee = await prisma.employee.findUnique({
      where: { userId },
      include: {
        services: {
          where: {
            status: 'COMPLETED',
            completedAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          },
          select: {
            amount: true,
            completedAt: true
          }
        },
        payments: {
          where: {
            status: 'PENDING'
          },
          select: {
            amount: true,
            createdAt: true
          }
        }
      }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const monthlyEarnings = employee.services.reduce((sum, service) => sum + service.amount, 0)
    const pendingPayments = employee.payments.reduce((sum, payment) => sum + payment.amount, 0)

    return NextResponse.json({
      monthlyEarnings,
      pendingPayments,
      completedServices: employee.services.length,
      services: employee.services,
      pendingPaymentsList: employee.payments
    })
  } catch (error) {
    console.error('Earnings error:', error)
    return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 })
  }
} 