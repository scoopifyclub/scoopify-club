import { NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    console.log('Starting employee login process...')
    const { email, password } = await request.json()
    console.log('Received login request for email:', email)

    if (!email || !password) {
      console.log('Missing email or password')
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    console.log('Finding user in database...')
    // Find the user in the User table
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        employee: true
      }
    })
    console.log('Database query result:', user ? 'User found' : 'User not found')

    if (!user) {
      console.log('User not found in database')
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify this is an employee account
    if (user.role !== 'EMPLOYEE') {
      console.log('User is not an employee, role:', user.role)
      return NextResponse.json(
        { message: 'This account is not authorized for employee access' },
        { status: 403 }
      )
    }

    // Verify employee record exists
    if (!user.employee) {
      console.log('No employee record found')
      return NextResponse.json(
        { message: 'Employee record not found' },
        { status: 404 }
      )
    }

    console.log('Verifying password...')
    // Verify password
    const isValid = await compare(password, user.password)
    console.log('Password verification result:', isValid)
    
    if (!isValid) {
      console.log('Invalid password')
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    console.log('Generating JWT token...')
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

    console.log('Login successful, returning response')
    // Return user data and token
    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json({
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    console.error('Login error details:', error)
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      { message: 'An error occurred during login', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 