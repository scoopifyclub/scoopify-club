import axios from 'axios';
import { prisma } from './prisma'

interface CashAppConfig {
  clientId: string;
  clientSecret: string;
  apiUrl: string;
}

const config: CashAppConfig = {
  clientId: process.env.CASHAPP_CLIENT_ID || '',
  clientSecret: process.env.CASHAPP_CLIENT_SECRET || '',
  apiUrl: process.env.CASHAPP_API_URL || 'https://api.cash.app/v1',
};

interface PaymentRequest {
  amount: number;
  currency: string;
  recipientId: string;
  note?: string;
}

interface PaymentResponse {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  currency: string;
  recipientId: string;
  createdAt: string;
}

export interface CashAppPayment {
  id: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
  createdAt: Date
  updatedAt: Date
}

export async function createCashAppPayment(amount: number): Promise<CashAppPayment> {
  const payment = await prisma.cashAppPayment.create({
    data: {
      amount,
      status: 'pending',
    },
  })

  return payment
}

export async function getCashAppPayment(id: string): Promise<CashAppPayment | null> {
  return prisma.cashAppPayment.findUnique({
    where: { id },
  })
}

export async function updateCashAppPaymentStatus(
  id: string,
  status: 'completed' | 'failed'
): Promise<CashAppPayment> {
  return prisma.cashAppPayment.update({
    where: { id },
    data: { status },
  })
}

export function generateCashAppQRCode(amount: number): string {
  // In a real implementation, this would generate a QR code for the CashApp payment
  // For demo purposes, we'll return a placeholder URL
  return `https://cash.app/pay/${amount}`
}

export async function createPayment(request: PaymentRequest): Promise<PaymentResponse> {
  try {
    const response = await axios.post(`${config.apiUrl}/payments`, request, {
      headers: {
        'Authorization': `Bearer ${config.clientSecret}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error creating CashApp payment:', error);
    throw new Error('Failed to create payment');
  }
}

export async function getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
  try {
    const response = await axios.get(`${config.apiUrl}/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${config.clientSecret}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error getting payment status:', error);
    throw new Error('Failed to get payment status');
  }
}

export async function processReferralPayment(userId: string, amount: number): Promise<PaymentResponse> {
  try {
    const paymentRequest: PaymentRequest = {
      amount,
      currency: 'USD',
      recipientId: userId,
      note: 'Referral bonus payment',
    };

    return await createPayment(paymentRequest);
  } catch (error) {
    console.error('Error processing referral payment:', error);
    throw new Error('Failed to process referral payment');
  }
}

export default {
  createPayment,
  getPaymentStatus,
  processReferralPayment,
  createCashAppPayment,
  getCashAppPayment,
  updateCashAppPaymentStatus,
  generateCashAppQRCode,
}; 