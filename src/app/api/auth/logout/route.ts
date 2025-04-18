import { NextResponse } from 'next/server'
import { logout } from '@/lib/auth'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const accessToken = cookies().get('accessToken')?.value
    if (!accessToken) {
      return NextResponse.json({ success: true })
    }

    const payload = await verifyToken(accessToken)
    if (payload) {
      await logout(payload.id)
    }

    // Clear cookies
    cookies().delete('accessToken')
    cookies().delete('refreshToken')

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 