import { NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { email, password, isEmployee } = await request.json()

    // Find user in the appropriate table based on isEmployee flag
    const user = await prisma[isEmployee ? 'employee' : 'customer'].findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
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

    // Generate JWT token
    const token = sign(
      { 
        id: user.id, 
        email: user.email,
        type: isEmployee ? 'employee' : 'customer'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    // Return user data and token
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json({
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'An error occurred during login' },
      { status: 500 }
    )
  }
} 