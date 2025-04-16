import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        customer: {
          include: {
            address: true,
          },
        },
        employee: true,
      },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { name, phone, address } = await request.json()

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        customer: {
          update: {
            phone,
            address: address
              ? {
                  upsert: {
                    create: address,
                    update: address,
                  },
                }
              : undefined,
          },
        },
      },
      include: {
        customer: {
          include: {
            address: true,
          },
        },
      },
    })

    const { password: _, ...userWithoutPassword } = updatedUser
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Profile update error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 