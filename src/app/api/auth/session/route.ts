import { NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { message: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      return NextResponse.json(
        { message: 'Invalid token format' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = verify(token, process.env.JWT_SECRET!) as { 
      id: string
      email: string
      role: string
    }

    // Get user with role-specific data
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        customer: true,
        employee: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json({ user: userWithoutPassword })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json(
      { message: 'Invalid or expired token' },
      { status: 401 }
    )
  }
} 