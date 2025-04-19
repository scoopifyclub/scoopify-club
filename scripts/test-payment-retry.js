// scripts/test-payment-retry.js
// This script tests the payment retry mechanism by simulating retrying failed payments

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();
// Load environment variables from .env.local (overrides .env)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Check if Stripe key is loaded correctly
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is not defined in environment variables.');
  console.error('Make sure you have a valid key in your .env.local file.');
  process.exit(1);
}

const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
const fs = require('fs');

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Stripe test tokens
// Instead of using raw card numbers, we use tokens for test cards
const TEST_TOKENS = {
  VISA_SUCCESS: 'tok_visa', // Always succeeds
  VISA_DECLINE: 'tok_chargeDeclined', // Always fails with decline code generic_decline
  VISA_REQUIRES_AUTH: 'tok_visa_3DSecure', // 3D Secure authentication required
};

// This simulates what the cron job would do
async function testPaymentRetry() {
  console.log('🧪 Testing payment retry mechanism');
  console.log(`Using Stripe API Key: ${process.env.STRIPE_SECRET_KEY.substring(0, 7)}...${process.env.STRIPE_SECRET_KEY.substring(process.env.STRIPE_SECRET_KEY.length - 4)}`);
  
  try {
    // Check if test data exists from a previous integration test
    const testDataPath = path.join(process.cwd(), 'test-stripe-data.json');
    let testData = null;
    
    if (fs.existsSync(testDataPath)) {
      testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
      console.log('📂 Using existing test data created at:', testData.testCreatedAt);
    }
    
    // If no test data exists, we need to create a test payment 
    if (!testData) {
      console.log('⚠️ No test data found. Creating test environment from scratch.');
      
      // 1. Create test customer in Stripe
      console.log('\n1️⃣ Creating test customer in Stripe');
      const customerEmail = `test-retry-${Date.now()}@example.com`;
      const stripeCustomer = await stripe.customers.create({
        email: customerEmail,
        name: 'Test Retry Customer',
        metadata: {
          test: 'true',
          created_by: 'retry_test'
        }
      });
      console.log(`✅ Test customer created: ${stripeCustomer.id}`);

      // 2. Create test payment method with token
      console.log('\n2️⃣ Creating test payment method with token');
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          token: TEST_TOKENS.VISA_SUCCESS,
        },
      });
      
      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: stripeCustomer.id,
      });
      
      // Set as default payment method
      await stripe.customers.update(stripeCustomer.id, {
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      });
      console.log(`✅ Payment method created and attached to customer`);
      
      // 3. Create test records in the database
      console.log('\n3️⃣ Creating test database records');
      
      // First, create a subscription for the test customer
      const testSubscription = await prisma.subscription.create({
        data: {
          planId: 'monthly_subscription',
          status: 'ACTIVE',
          startDate: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
      
      // Create a test user and customer
      const testUser = await prisma.user.create({
        data: {
          email: customerEmail,
          name: 'Test Retry User',
          password: 'hashed_password_would_go_here',
          role: 'CUSTOMER',
          emailVerified: true,
          customer: {
            create: {
              subscription: {
                connect: {
                  id: testSubscription.id
                }
              }
            }
          }
        },
        include: {
          customer: {
            include: {
              subscription: true
            }
          }
        }
      });
      
      // 4. Create a failed payment in our database
      const failedPayment = await prisma.payment.create({
        data: {
          amount: 20.00,
          status: 'FAILED',
          type: 'SERVICE',
          customerId: testUser.customer.id,
          subscriptionId: testUser.customer.subscription.id,
        }
      });
      console.log(`✅ Created failed payment record: ${failedPayment.id}`);
      
      // 5. Create a payment retry record
      const paymentRetry = await prisma.paymentRetry.create({
        data: {
          paymentId: failedPayment.id,
          status: 'SCHEDULED',
          retryCount: 0,
          nextRetryDate: new Date() // Schedule for immediate retry
        }
      });
      console.log(`✅ Created payment retry record: ${paymentRetry.id}`);
      
      // Store the test data
      testData = {
        stripeCustomerId: stripeCustomer.id,
        databaseUserId: testUser.id,
        databaseCustomerId: testUser.customer.id,
        databaseSubscriptionId: testUser.customer.subscription.id,
        databasePaymentId: failedPayment.id,
        databasePaymentRetryId: paymentRetry.id,
        testCreatedAt: new Date().toISOString()
      };
      
      fs.writeFileSync('test-retry-data.json', JSON.stringify(testData, null, 2));
    }
    
    // Now simulate the retry process
    console.log('\n4️⃣ Simulating payment retry process');
    
    // Get the customer info
    const customer = await prisma.customer.findUnique({
      where: { id: testData.databaseCustomerId },
      include: { subscription: true }
    });
    
    if (!customer) {
      throw new Error('Test customer not found in database');
    }
    
    // Get the payment to retry
    const payment = await prisma.payment.findUnique({
      where: { id: testData.databasePaymentId }
    });
    
    if (!payment) {
      throw new Error('Test payment not found in database');
    }
    
    // Get the payment retry record
    const paymentRetry = await prisma.paymentRetry.findUnique({
      where: { id: testData.databasePaymentRetryId }
    });
    
    if (!paymentRetry) {
      throw new Error('Test payment retry not found in database');
    }
    
    // Update retry status to pending
    await prisma.paymentRetry.update({
      where: { id: paymentRetry.id },
      data: { status: 'PENDING' }
    });
    console.log(`✅ Updated payment retry status to PENDING`);
    
    // Create a new payment intent in Stripe
    console.log('\n5️⃣ Creating new payment intent in Stripe');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(payment.amount * 100), // Convert to cents
      currency: 'usd',
      customer: testData.stripeCustomerId,
      payment_method_types: ['card'],
      confirm: true, // Auto-confirm so it processes immediately
      description: `Payment retry test for ${payment.id}`,
    });
    console.log(`✅ Created payment intent: ${paymentIntent.id} (Status: ${paymentIntent.status})`);
    
    // Update the payment retry record
    await prisma.paymentRetry.update({
      where: { id: paymentRetry.id },
      data: {
        status: paymentIntent.status === 'succeeded' ? 'SUCCESS' : 'FAILED',
      }
    });
    
    // If the payment succeeded, update the original payment
    if (paymentIntent.status === 'succeeded') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          updatedAt: new Date()
        }
      });
      
      // Also update the subscription if it exists
      if (payment.subscriptionId) {
        await prisma.subscription.update({
          where: { id: payment.subscriptionId },
          data: {
            status: 'ACTIVE',
          }
        });
      }
      
      console.log(`✅ Payment retry SUCCEEDED. Original payment marked as COMPLETED.`);
    } else {
      console.log(`⚠️ Payment retry attempt returned status: ${paymentIntent.status}`);
    }
    
    console.log('\n🎉 Test completed successfully!');
    console.log('\n📝 To clean up test data, run: node scripts/cleanup-retry-tests.js');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPaymentRetry(); 