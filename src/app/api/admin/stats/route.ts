import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: Request) {
  try {
    // Verify admin authentication
    const auth = await verifyAuth(request)
    if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (auth.session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get total customers
    const totalCustomers = await prisma.customer.count()

    // Get total employees
    const totalEmployees = await prisma.employee.count()

    // Get active services (scheduled or in progress)
    const activeServices = await prisma.service.count({
      where: {
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS']
        }
      }
    })

    // Get monthly revenue
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const monthlyPayments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        }
      },
      select: {
        amount: true
      }
    })

    const monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0)

    // Get service completion stats
    const completedServices = await prisma.service.count({
      where: {
        status: 'COMPLETED',
        scheduledDate: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    })

    const totalServices = await prisma.service.count({
      where: {
        scheduledDate: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    })

    return NextResponse.json({
      totalCustomers,
      totalEmployees,
      activeServices,
      monthlyRevenue,
      serviceCompletion: {
        completed: completedServices,
        total: totalServices
      }
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 