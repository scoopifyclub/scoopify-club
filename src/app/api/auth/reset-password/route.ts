import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import { Resend } from 'resend'
import { rateLimit } from '@/middleware/rate-limit'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(request)
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const { email, token, newPassword } = body

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    // If token and newPassword are provided, this is a password reset
    if (token && newPassword) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, resetToken: true, resetTokenExpiry: true },
      })

      if (!user || !user.resetToken || !user.resetTokenExpiry) {
        return NextResponse.json(
          { message: 'Invalid or expired reset token' },
          { status: 400 }
        )
      }

      if (user.resetToken !== token || new Date() > user.resetTokenExpiry) {
        return NextResponse.json(
          { message: 'Invalid or expired reset token' },
          { status: 400 }
        )
      }

      const hashedPassword = await hash(newPassword, 12)

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      })

      return NextResponse.json({ message: 'Password reset successful' })
    }

    // Otherwise, this is a password reset request
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (user) {
      const resetToken = sign(
        { userId: user.id },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      )

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour
        },
      })

      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`
      
      await resend.emails.send({
        from: 'noreply@scoopifyclub.com',
        to: email,
        subject: 'Password Reset Request',
        html: `
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      })
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: 'If an account exists with this email, you will receive a password reset link.',
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { message: 'An error occurred. Please try again later.' },
      { status: 500 }
    )
  }
} 