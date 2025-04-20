import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  
  // Clear all auth-related cookies individually with await
  await cookieStore.delete('accessToken')
  await cookieStore.delete('accessToken_client')
  await cookieStore.delete('refreshToken')
  await cookieStore.delete('deviceFingerprint')
  await cookieStore.delete('adminToken')
  await cookieStore.delete('next-auth.session-token')
  await cookieStore.delete('next-auth.callback-url')
  await cookieStore.delete('next-auth.csrf-token')

  // Set cookies with expired date to ensure they're removed
  const response = NextResponse.json({ success: true })
  response.cookies.set('accessToken', '', { maxAge: 0 })
  response.cookies.set('accessToken_client', '', { maxAge: 0 })
  response.cookies.set('refreshToken', '', { maxAge: 0 })
  response.cookies.set('deviceFingerprint', '', { maxAge: 0 })
  response.cookies.set('adminToken', '', { maxAge: 0 })
  
  return response
} 