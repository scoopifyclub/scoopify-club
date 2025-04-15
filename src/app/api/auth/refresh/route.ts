import { NextResponse } from 'next/server'
import { verify, sign } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json(
        { message: 'No token provided' },
        { status: 401 }
      )
    }

    // Verify current token
    const decoded = verify(token, process.env.JWT_SECRET!) as {
      id: string
      email: string
      role: string
      aud: string
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Generate new token
    const newToken = sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
        iss: 'scoopify',
        aud: decoded.aud
      },
      process.env.JWT_SECRET!,
      { algorithm: 'HS256' }
    )

    // Create response with new token
    const response = NextResponse.json({ token: newToken })
    
    // Set secure cookie
    response.cookies.set('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { message: 'Invalid or expired token' },
      { status: 401 }
    )
  }
} 