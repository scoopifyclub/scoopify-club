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
      hasFingerprint: !!fingerprint,
      fingerprintStart: fingerprint ? fingerprint.substring(0, 8) : 'null'
    });

    if (!refreshTokenCookie) {
      console.log('No refresh token found in cookies');
      return NextResponse.json(
        { error: 'No refresh token found' },
        { status: 401 }
      )
    }

    // Always attempt to refresh token even if fingerprint is missing
    console.log('Attempting to refresh the token');
    let refreshResult;
    try {
      refreshResult = await refreshToken(refreshTokenCookie, fingerprint);
    } catch (refreshError) {
      console.log('First refresh attempt failed, trying without fingerprint validation');
      // Fall back to refresh without fingerprint if that's the issue
      if (fingerprint && refreshError instanceof Error && 
          (refreshError.message.includes('fingerprint') || refreshError.message.includes('Invalid refresh token'))) {
        refreshResult = await refreshToken(refreshTokenCookie);
      } else {
        throw refreshError; // Re-throw if it's not a fingerprint issue
      }
    }
    
    const { accessToken, refreshToken: newRefreshToken, user } = refreshResult;
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

    // Set fingerprint cookie if not already set - generate a new one from the user object
    if (!fingerprint) {
      const newFingerprint = user.deviceFingerprint || (user.id + '-' + Date.now());
      response.cookies.set('fingerprint', newFingerprint, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      })
      console.log('Generated new fingerprint for user:', user.id);
    } else {
      response.cookies.set('fingerprint', fingerprint, {
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