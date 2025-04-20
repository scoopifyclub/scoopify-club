import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    // Find and delete test customer
    const testCustomer = await prisma.user.findUnique({
      where: { email: 'testcustomer@scoopify.com' },
      include: { customer: true },
    });

    if (testCustomer?.customer) {
      // Delete related records
      await prisma.$transaction([
        prisma.service.deleteMany({
          where: { customerId: testCustomer.customer.id },
        }),
        prisma.subscription.deleteMany({
          where: { customerId: testCustomer.customer.id },
        }),
        prisma.address.deleteMany({
          where: { customerId: testCustomer.customer.id },
        }),
        prisma.customer.delete({
          where: { id: testCustomer.customer.id },
        }),
        prisma.user.delete({
          where: { id: testCustomer.id },
        }),
      ]);
    }

    // Delete test service plans
    await prisma.servicePlan.deleteMany({
      where: { name: 'Weekly Service' },
    });

    return NextResponse.json({
      message: 'Test data cleaned up successfully',
    });
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    return NextResponse.json(
      { error: 'Failed to clean up test data' },
      { status: 500 }
    );
  }
} 