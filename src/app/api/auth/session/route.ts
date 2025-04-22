import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import prisma from "@/lib/prisma";
import { verifyToken, refreshToken } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  console.log('Session endpoint called');
  
  try {
    // Remove rate limiting for session endpoint to prevent login loops
    
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    const refreshTokenCookie = cookieStore.get('refreshToken')?.value;
    const fingerprint = cookieStore.get('fingerprint')?.value;
    
    console.log('Session cookies check:', { 
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshTokenCookie,
      hasFingerprint: !!fingerprint
    });

    if (!accessToken) {
      console.log('No access token found in cookies');
      
      // If we have a refresh token, attempt to refresh the session automatically
      if (refreshTokenCookie && fingerprint) {
        try {
          console.log('Attempting to refresh the token');
          const refreshResult = await refreshToken(refreshTokenCookie, fingerprint);
          
          // Create response with user data
          const response = NextResponse.json({
            user: {
              id: refreshResult.user.id,
              email: refreshResult.user.email,
              name: refreshResult.user.name,
              role: refreshResult.user.role,
              customerId: refreshResult.user.customer?.id,
              employeeId: refreshResult.user.employee?.id
            }
          });
          
          // Set cookies with new tokens
          response.cookies.set('accessToken', refreshResult.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60, // 15 minutes
          });
          
          response.cookies.set('refreshToken', refreshResult.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 days
          });
          
          // Make sure to set the fingerprint cookie as well
          response.cookies.set('fingerprint', fingerprint, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 days
          });
          
          console.log('Token refresh successful');
          return response;
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
        }
      } else if (refreshTokenCookie) {
        // Handle the case where we have a refresh token but no fingerprint
        console.log('Refresh token exists but no fingerprint. Attempting refresh without fingerprint verification');
        try {
          const refreshResult = await refreshToken(refreshTokenCookie);
          
          // Create response with user data
          const response = NextResponse.json({
            user: {
              id: refreshResult.user.id,
              email: refreshResult.user.email,
              name: refreshResult.user.name,
              role: refreshResult.user.role,
              customerId: refreshResult.user.customer?.id,
              employeeId: refreshResult.user.employee?.id
            }
          });
          
          // Set cookies with new tokens
          response.cookies.set('accessToken', refreshResult.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60, // 15 minutes
          });
          
          response.cookies.set('refreshToken', refreshResult.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 days
          });
          
          // Generate a new fingerprint if needed
          const newFingerprint = `regenerated-${Date.now()}-${refreshResult.user.id.substring(0, 8)}`;
          response.cookies.set('fingerprint', newFingerprint, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 days
          });
          
          console.log('Token refresh successful without fingerprint');
          return response;
        } catch (refreshError) {
          console.error('Error refreshing token without fingerprint:', refreshError);
        }
      }
      
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    try {
      console.log('Verifying access token');
      const payload = await verifyToken(accessToken);
      
      if (!payload) {
        console.log('Token verification failed');
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }
      
      console.log('Token verified, user ID:', payload.id);

      // Look up user in database
      console.log('Looking up user in database');
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        include: {
          customer: true,
          employee: true
        }
      });

      if (!user) {
        console.log('User not found in database for ID:', payload.id);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      console.log('User found:', { id: user.id, email: user.email, role: user.role });

      // Return only necessary user data
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          customerId: user.customer?.id,
          employeeId: user.employee?.id
        }
      });
    } catch (tokenError) {
      console.error('Error verifying token:', tokenError);
      
      // Token is invalid but we have a refresh token, try to refresh
      if (refreshTokenCookie && fingerprint) {
        try {
          console.log('Attempting to refresh the token');
          const refreshResult = await refreshToken(refreshTokenCookie, fingerprint);
          
          // Set new tokens in response
          const response = NextResponse.json({
            user: {
              id: refreshResult.user.id,
              email: refreshResult.user.email,
              name: refreshResult.user.name,
              role: refreshResult.user.role,
              customerId: refreshResult.user.customer?.id,
              employeeId: refreshResult.user.employee?.id
            }
          });
          
          // Set cookies with new tokens
          response.cookies.set('accessToken', refreshResult.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60, // 15 minutes
          });
          
          response.cookies.set('refreshToken', refreshResult.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 days
          });
          
          // Make sure to set the fingerprint cookie as well
          response.cookies.set('fingerprint', fingerprint, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 days
          });
          
          console.log('Token refresh successful');
          return response;
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
        }
      }
      
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
  } catch (error) {
    console.error('Session endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 