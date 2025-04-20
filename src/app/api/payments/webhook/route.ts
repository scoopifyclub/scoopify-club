import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateCashAppPaymentStatus } from '@/lib/cashapp'

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('X-CashApp-Signature')
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    // Verify webhook signature here
    // This is a placeholder - implement proper signature verification
    const isValid = true // Replace with actual signature verification

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body = await req.json()
    const { paymentId, status } = body

    if (!paymentId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await updateCashAppPaymentStatus(paymentId, status)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
} 