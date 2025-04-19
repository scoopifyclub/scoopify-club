import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { addDays } from 'date-fns'
import { getSubscriptionPlans, getOneTimeServices } from '@/lib/constants'
import { validatePassword } from '@/lib/password'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      email,
      name,
      password,
      deviceFingerprint,
      role = 'CUSTOMER',
      address
    } = body

    // Validate required fields
    if (!email || !name || !password || !deviceFingerprint) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Validate password strength
    const validation = validatePassword(password)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Password does not meet requirements',
          details: validation.errors,
          strength: validation.strength
        },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Generate verification token
    const verificationToken = uuidv4()
    const verificationTokenExpiry = new Date()
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24)

    // Create user with appropriate role data
    const userData = {
      email,
      name,
      password: hashedPassword,
      role,
      deviceFingerprint,
      verificationToken,
      verificationTokenExpiry,
      ...(role === 'CUSTOMER' && {
        customer: {
          create: {
            address: address && {
              create: {
                street: address.street,
                city: address.city,
                state: address.state,
                zipCode: address.zipCode
              }
            }
          }
        }
      }),
      ...(role === 'EMPLOYEE' && {
        employee: {
          create: {}
        }
      })
    }

    const user = await prisma.user.create({
      data: userData,
      include: {
        customer: {
          include: {
            address: true
          }
        },
        employee: true
      }
    })

    // Remove sensitive data before sending response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { user: userWithoutPassword },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 