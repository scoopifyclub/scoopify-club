import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const [
      totalCustomers,
      totalEmployees,
      activeSubscriptions,
      pendingServices,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.employee.count(),
      prisma.subscription.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.service.count({
        where: { status: 'PENDING' },
      }),
    ])

    return NextResponse.json({
      totalCustomers,
      totalEmployees,
      activeSubscriptions,
      pendingServices,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 