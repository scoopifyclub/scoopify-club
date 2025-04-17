import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { prisma } from "./prisma"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convert degrees to radians
export function degreesToRadians(deg: number): number {
  return deg * (Math.PI / 180);
}

// Format currency for display
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Format date for display
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Format time for display
export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format date and time together
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

// Truncate long strings
export function truncateString(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number format
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
}

// Generate random string
export function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Utility for delaying execution
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate unique referral code
export async function generateReferralCode(): Promise<string> {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar looking characters
  const codeLength = 6;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    let code = '';
    for (let i = 0; i < codeLength; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code already exists
    const existing = await prisma.customer.findFirst({
      where: { referralCode: code }
    });

    if (!existing) {
      return code;
    }

    attempts++;
  }

  throw new Error('Failed to generate unique referral code');
}

// Calculate referral commission
export function calculateReferralCommission(subscriptionAmount: number): number {
  const scooperShare = subscriptionAmount * 0.75; // 75% goes to scooper
  const remainingAmount = subscriptionAmount - scooperShare;
  const referralCommission = 5; // $5 fixed referral fee

  // Only pay referral if there's enough margin after scooper's share
  if (remainingAmount >= referralCommission) {
    return referralCommission;
  }

  // If not enough margin, pay what's available (or 0 if negative)
  return Math.max(0, remainingAmount);
}

export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
} 