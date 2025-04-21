import { NextRequest, NextResponse } from 'next/server'
import prisma from "@/lib/prisma";
import { requireAuth } from '@/lib/auth'

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    console.log('Fetching profile for user:', user.id);

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

    console.log('Found user profile:', userProfile ? { id: userProfile.id, role: userProfile.role } : 'null');

    if (!userProfile) {
      console.log('User profile not found for ID:', user.id);
      return NextResponse.json(
        { message: 'User profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(userProfile)
  } catch (error) {
    console.error('Error in profile API:', error);
    return NextResponse.json(
      { message: 'Failed to fetch user profile', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}) 