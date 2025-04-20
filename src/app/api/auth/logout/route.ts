import { NextResponse } from 'next/server'
import { logout } from '@/lib/auth'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

export async function POST() {
  try {
    // Clear all authentication cookies
    cookies().delete('accessToken')
    cookies().delete('refreshToken')
    cookies().delete('fingerprint')

    return NextResponse.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    )
  }
} 