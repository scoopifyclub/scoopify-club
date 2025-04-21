import { NextResponse } from 'next/server'
import { refreshToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const refreshTokenCookie = cookieStore.get('refreshToken')?.value
    const fingerprint = cookieStore.get('fingerprint')?.value

    if (!refreshTokenCookie) {
      return NextResponse.json(
        { error: 'No refresh token found' },
        { status: 401 }
      )
    }

    const { accessToken, refreshToken: newRefreshToken, user } = await refreshToken(refreshTokenCookie, fingerprint)

    // Set new access token cookie
    cookieStore.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60, // 15 minutes
    })

    // Set new refresh token cookie
    cookieStore.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    // Set fingerprint cookie if not already set
    if (!fingerprint) {
      cookieStore.set('fingerprint', user.deviceFingerprint!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        customerId: user.customer?.id,
        employeeId: user.employee?.id,
      },
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Invalid refresh token') || 
          error.message.includes('Device fingerprint mismatch')) {
        // Clear cookies if refresh token is invalid or fingerprint mismatch
        const cookieStore = await cookies()
        cookieStore.delete('accessToken')
        cookieStore.delete('refreshToken')
        cookieStore.delete('fingerprint')
        return NextResponse.json(
          { error: 'Session expired. Please login again.' },
          { status: 401 }
        )
      }
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 