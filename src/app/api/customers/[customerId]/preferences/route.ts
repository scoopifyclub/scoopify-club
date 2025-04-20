import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from "@/lib/prisma";
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { customerId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const preferences = await prisma.customerPreferences.findUnique({
      where: {
        customerId: params.customerId,
      },
    })

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error fetching preferences:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { customerId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const { preferredDay, gateCode, specialInstructions, accessNotes } = body

    const preferences = await prisma.customerPreferences.upsert({
      where: {
        customerId: params.customerId,
      },
      update: {
        preferredDay,
        gateCode,
        specialInstructions,
        accessNotes,
      },
      create: {
        customerId: params.customerId,
        preferredDay,
        gateCode,
        specialInstructions,
        accessNotes,
      },
    })

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error updating preferences:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 