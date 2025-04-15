import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { validatePassword } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { name, email, password, isEmployee, phone, address } = await request.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { message: passwordValidation.message },
        { status: 400 }
      )
    }

    // Validate phone for customers
    if (!isEmployee) {
      if (!phone) {
        return NextResponse.json(
          { message: 'Phone number is required for customers' },
          { status: 400 }
        )
      }
      const phoneRegex = /^\+?[1-9]\d{1,14}$/
      if (!phoneRegex.test(phone)) {
        return NextResponse.json(
          { message: 'Invalid phone number format' },
          { status: 400 }
        )
      }
      if (!address) {
        return NextResponse.json(
          { message: 'Address is required for customers' },
          { status: 400 }
        )
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user in the User table
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: isEmployee ? 'EMPLOYEE' : 'CUSTOMER',
      },
    })

    // Create the corresponding Customer or Employee record
    if (isEmployee) {
      await prisma.employee.create({
        data: {
          name,
          email,
          userId: user.id,
          status: 'ACTIVE',
        },
      })
    } else {
      await prisma.customer.create({
        data: {
          name,
          email,
          phone,
          address,
          userId: user.id,
          status: 'ACTIVE',
        },
      })
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
        aud: isEmployee ? 'employee' : 'customer'
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
    console.error('Signup error:', error)
    return NextResponse.json(
      { message: 'An error occurred during signup' },
      { status: 500 }
    )
  }
} 