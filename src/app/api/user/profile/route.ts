import { NextRequest, NextResponse } from 'next/server'
import prisma from "@/lib/prisma";
import { requireAuth } from '@/lib/auth'

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        customer: user.role === 'CUSTOMER' ? {
          select: {
            address: true,
            coordinates: true,
            subscription: {
              select: {
                plan: true,
                price: true,
                status: true
              }
            }
          }
        } : false,
        employee: user.role === 'EMPLOYEE' ? {
          select: {
            status: true,
            rating: true,
            completedServices: true
          }
        } : false
      }
    })

    if (!userProfile) {
      return NextResponse.json(
        { message: 'User profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(userProfile)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { message: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}) 