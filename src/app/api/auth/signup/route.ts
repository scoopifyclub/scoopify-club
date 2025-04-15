import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { name, email, password, isEmployee } = await request.json()

    // Check if user already exists
    const existingUser = await prisma[isEmployee ? 'employee' : 'customer'].findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user in the appropriate table
    const user = await prisma[isEmployee ? 'employee' : 'customer'].create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

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
    console.error('Signup error:', error)
    return NextResponse.json(
      { message: 'An error occurred during signup' },
      { status: 500 }
    )
  }
} 