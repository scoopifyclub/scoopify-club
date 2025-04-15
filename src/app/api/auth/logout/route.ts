import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    // Create response
    const response = NextResponse.json({ message: 'Logged out successfully' })
    
    // Clear auth cookies
    response.cookies.delete('token')
    response.cookies.delete('userType')
    
    // Add cache control headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { message: 'An error occurred during logout' },
      { status: 500 }
    )
  }
} 