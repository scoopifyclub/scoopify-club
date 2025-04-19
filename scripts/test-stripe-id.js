// scripts/test-stripe-id.js
// Simple test for the stripeCustomerId field

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testStripeId() {
  try {
    console.log('🔍 Testing stripeCustomerId field in Customer model');
    
    // Get a test customer
    const customers = await prisma.customer.findMany({
      take: 1,
      include: { user: true }
    });
    
    if (customers.length === 0) {
      console.log('No customers found in database');
      return;
    }
    
    const customer = customers[0];
    console.log(`Test customer ID: ${customer.id}`);
    console.log(`Original fields:`, Object.keys(customer));
    
    // Try to update stripeCustomerId
    const testStripeId = `stripe_test_${Date.now()}`;
    console.log(`Setting test Stripe ID: ${testStripeId}`);
    
    try {
      const updated = await prisma.customer.update({
        where: { id: customer.id },
        data: { stripeCustomerId: testStripeId }
      });
      
      console.log('✅ Customer updated successfully');
      console.log(`Updated fields:`, Object.keys(updated));
      console.log(`New stripeCustomerId: ${updated.stripeCustomerId}`);
    } catch (error) {
      console.error('❌ Error updating customer:', error);
    }
    
  } catch (error) {
    console.error('❌ Error running test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testStripeId(); 