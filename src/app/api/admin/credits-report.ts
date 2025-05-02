import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Returns a list of customers whose credits have been depleted for more than 14 days
export async function GET(request: Request) {
  // 14 days ago
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  // Find customers with serviceCredits = 0 and creditsDepletedAt older than 14 days
  const staleCustomers = await prisma.customer.findMany({
    where: {
      serviceCredits: 0,
      creditsDepletedAt: {
        not: null,
        lt: twoWeeksAgo,
      },
    },
    select: {
      id: true,
      userId: true,
      creditsDepletedAt: true,
      createdAt: true,
      updatedAt: true,
      phone: true,
      email: true,
      stripeCustomerId: true,
    },
  });

  return NextResponse.json({ staleCustomers });
}
