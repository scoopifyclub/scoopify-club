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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
        notificationPreferences: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('[SETTINGS_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { name, phone, address, notificationPreferences } = body

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phone,
        address,
        notificationPreferences: {
          update: notificationPreferences
        }
      },
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
        notificationPreferences: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('[SETTINGS_PATCH]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
} 