import { NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find the user in the User table
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        employee: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify this is an employee account
    if (user.role !== 'EMPLOYEE') {
      return NextResponse.json(
        { message: 'This account is not authorized for employee access' },
        { status: 403 }
      )
    }

    // Verify employee record exists
    if (!user.employee) {
      return NextResponse.json(
        { message: 'Employee record not found' },
        { status: 404 }
      )
    }

    // Verify password
    const isValid = await compare(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate JWT token with additional security claims
    const token = sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
        iss: 'scoopify',
        aud: 'employee'
      },
      process.env.JWT_SECRET!,
      { algorithm: 'HS256' }
    )

    // Return user data and token
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json({
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    console.error('Employee login error:', error)
    return NextResponse.json(
      { message: 'An error occurred during login' },
      { status: 500 }
    )
  }
} 