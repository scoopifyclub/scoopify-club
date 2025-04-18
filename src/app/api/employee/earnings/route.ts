import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getEmployeeEarnings } from '@/lib/payment'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where = {
      employeeId: decoded.id,
      ...(from && to ? {
        createdAt: {
          gte: new Date(from),
          lte: new Date(to),
        },
      } : {}),
    }

    const earnings = await prisma.earning.findMany({
      where,
      include: {
        paymentDistribution: {
          include: {
            payment: {
              include: {
                subscription: {
                  include: {
                    customer: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const stats = {
      totalEarned: earnings
        .filter(e => e.status === 'PAID')
        .reduce((sum, e) => sum + e.amount, 0),
      pendingAmount: earnings
        .filter(e => e.status === 'PENDING')
        .reduce((sum, e) => sum + e.amount, 0),
      totalJobs: earnings.length,
    }

    return NextResponse.json({
      earnings: earnings.map(earning => ({
        id: earning.id,
        amount: earning.amount,
        status: earning.status,
        createdAt: earning.createdAt,
        payment: {
          subscription: {
            plan: earning.paymentDistribution.payment.subscription.plan,
            customer: {
              name: earning.paymentDistribution.payment.subscription.customer.name,
            },
          },
          date: earning.paymentDistribution.payment.createdAt,
        },
      })),
      stats,
    })
  } catch (error) {
    console.error('Error fetching employee earnings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 