import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Test database connection
    const user = await prisma.user.findUnique({
      where: { email: 'customer@scoopify.com' },
      include: {
        customer: true
      }
    })

    console.log('Database query completed:', user ? 'User found' : 'User not found')

    if (!user) {
      return NextResponse.json(
        { error: 'Test user not found in database' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Database connection successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        hasCustomerRecord: !!user.customer
      }
    })
  } catch (error) {
    console.error('Database test error:', error)
    // Log the full error details
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      { error: 'Database connection failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 