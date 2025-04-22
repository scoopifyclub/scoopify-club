import { NextResponse } from 'next/server'
import { refreshToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    console.log('Refresh token endpoint called');
    const cookieStore = await cookies()
    const refreshTokenCookie = cookieStore.get('refreshToken')?.value
    const fingerprint = cookieStore.get('fingerprint')?.value

    console.log('Refresh token cookies check:', { 
      hasRefreshToken: !!refreshTokenCookie,
      hasFingerprint: !!fingerprint
    });

    if (!refreshTokenCookie) {
      console.log('No refresh token found in cookies');
      return NextResponse.json(
        { error: 'No refresh token found' },
        { status: 401 }
      )
    }

    console.log('Attempting to refresh the token');
    const { accessToken, refreshToken: newRefreshToken, user } = await refreshToken(refreshTokenCookie, fingerprint)
    console.log('Token refresh successful for user:', { id: user.id, role: user.role });

    // Create the response object with user data
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        customerId: user.customer?.id,
        employeeId: user.employee?.id,
      },
    })

    // Set the cookies directly on the response object
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15 minutes
    })

    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    // Set fingerprint cookie if not already set
    if (!fingerprint) {
      response.cookies.set('fingerprint', user.deviceFingerprint || '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      })
    }

    return response
  } catch (error) {
    console.error('Refresh token error:', error);
    if (error instanceof Error) {
      if (error.message.includes('Invalid refresh token') || 
          error.message.includes('Device fingerprint mismatch')) {
        // Clear cookies if refresh token is invalid or fingerprint mismatch
        const response = NextResponse.json(
          { error: 'Session expired. Please login again.' },
          { status: 401 }
        )
        
        // Clear cookies on the response
        response.cookies.set('accessToken', '', { 
          maxAge: 0,
          path: '/'
        })
        response.cookies.set('refreshToken', '', { 
          maxAge: 0,
          path: '/'
        })
        response.cookies.set('fingerprint', '', { 
          maxAge: 0,
          path: '/'
        })
        
        return response
      }
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 