import { NextResponse } from 'next/server'
import { refreshToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const refreshTokenCookie = cookies().get('refreshToken')?.value
    if (!refreshTokenCookie) {
      return NextResponse.json(
        { error: 'No refresh token found' },
        { status: 401 }
      )
    }

    const { accessToken, user } = await refreshToken(refreshTokenCookie)

    // Set new access token cookie
    cookies().set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60, // 15 minutes
    })

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
      if (error.message.includes('Invalid refresh token')) {
        // Clear cookies if refresh token is invalid
        cookies().delete('accessToken')
        cookies().delete('refreshToken')
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