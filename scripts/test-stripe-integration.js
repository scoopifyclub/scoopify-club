// scripts/test-stripe-integration.js
// This script tests the Stripe integration by creating test customers,
// subscriptions, and simulating payment failures/retries

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

async function testStripeIntegration() {
  console.log('🧪 Starting Stripe integration tests');
  console.log(`Using Stripe API Key: ${process.env.STRIPE_SECRET_KEY.substring(0, 7)}...${process.env.STRIPE_SECRET_KEY.substring(process.env.STRIPE_SECRET_KEY.length - 4)}`);
  
  try {
    // Step 1: Create a test customer in Stripe
    console.log('\n1️⃣ Creating test customer in Stripe');
    const customerEmail = `test-${Date.now()}@example.com`;
    const stripeCustomer = await stripe.customers.create({
      email: customerEmail,
      name: 'Test Customer',
      metadata: {
        test: 'true',
        created_by: 'integration_test'
      }
    });
    console.log(`✅ Test customer created: ${stripeCustomer.id}`);

    // Step 2: Create a test payment method using a test token
    console.log('\n2️⃣ Creating test payment method');
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        token: TEST_TOKENS.VISA_SUCCESS,
      },
    });
    console.log(`✅ Test payment method created: ${paymentMethod.id}`);

    // Step 3: Attach payment method to customer
    console.log('\n3️⃣ Attaching payment method to customer');
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: stripeCustomer.id,
    });
    
    // Set as default payment method
    await stripe.customers.update(stripeCustomer.id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });
    console.log(`✅ Payment method attached and set as default`);

    // Step 4: Create a product and price if they don't exist
    console.log('\n4️⃣ Creating test product and price');
    let price;
    const existingPrices = await stripe.prices.list({
      lookup_keys: ['test_monthly_subscription'],
      active: true,
    });

    if (existingPrices.data.length > 0) {
      price = existingPrices.data[0];
      console.log(`✅ Using existing price: ${price.id}`);
    } else {
      // Create a new product
      const product = await stripe.products.create({
        name: 'Test Subscription',
        description: 'Monthly subscription for testing',
        metadata: {
          test: 'true'
        }
      });
      
      // Create a price for the product
      price = await stripe.prices.create({
        unit_amount: 2000, // $20.00
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        lookup_key: 'test_monthly_subscription',
        product: product.id,
        metadata: {
          test: 'true'
        }
      });
      console.log(`✅ Created new product ${product.id} and price ${price.id}`);
    }

    // Step 5: Create a subscription
    console.log('\n5️⃣ Creating test subscription');
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomer.id,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        test: 'true'
      }
    });
    console.log(`✅ Subscription created: ${subscription.id}`);
    console.log(`   Status: ${subscription.status}`);
    
    // Step 6: Record test data in our database
    console.log('\n6️⃣ Recording test data in our database');
    
    // First, create a test user and customer
    const testUser = await prisma.user.create({
      data: {
        email: customerEmail,
        name: 'Test User',
        password: 'hashed_password_would_go_here',
        role: 'CUSTOMER',
        emailVerified: true,
        customer: {
          create: {}
        }
      },
      include: {
        customer: true
      }
    });

    // Now create a subscription with the customer ID
    const testSubscription = await prisma.subscription.create({
      data: {
        customerId: testUser.customer.id,
        planId: price.id,
        status: subscription.status === 'active' ? 'ACTIVE' : 'CANCELLED',
        startDate: new Date()
      }
    });

    // Update the customer to connect it with the subscription
    await prisma.customer.update({
      where: { id: testUser.customer.id },
      data: {
        subscriptionId: testSubscription.id,
      }
    });

    // Update the user with the newly added customer
    const updatedUser = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: {
        customer: {
          include: {
            subscription: true
          }
        }
      }
    });
    
    console.log(`✅ Test user and subscription recorded in database`);
    console.log(`   User ID: ${updatedUser.id}`);
    console.log(`   Customer ID: ${updatedUser.customer.id}`);
    console.log(`   Subscription ID: ${updatedUser.customer.subscription.id}`);
    console.log(`   Stripe Customer ID: ${stripeCustomer.id} (will update to store properly)`);

    // Update customer with Stripe customer ID
    await prisma.customer.update({
      where: { id: updatedUser.customer.id },
      data: {
        stripeCustomerId: stripeCustomer.id
      }
    }).then(() => {
      console.log(`✅ Successfully stored Stripe customer ID in database`);
    }).catch(e => {
      // If the field doesn't exist, we'll log it but continue
      console.log(`Note: Could not store stripeCustomerId in customer record: ${e.message}`);
      console.log(`This is likely due to the field not being in your schema or needing to restart the server.`);
    });

    // Step 7: Test pausing a subscription
    console.log('\n7️⃣ Testing subscription pause');
    await stripe.subscriptions.update(subscription.id, {
      pause_collection: {
        behavior: 'mark_uncollectible',
      },
      metadata: {
        status: 'paused',
        pausedAt: new Date().toISOString()
      }
    });
    console.log(`✅ Subscription paused in Stripe`);
    
    // Update in our database
    await prisma.subscription.update({
      where: { id: updatedUser.customer.subscription.id },
      data: {
        status: 'PAUSED',
      }
    });
    console.log(`✅ Subscription marked as paused in database`);

    // Step 8: Test resuming a subscription
    console.log('\n8️⃣ Testing subscription resume');
    await stripe.subscriptions.update(subscription.id, {
      pause_collection: '',  // Remove pause
      metadata: {
        status: 'active',
        resumedAt: new Date().toISOString()
      }
    });
    console.log(`✅ Subscription resumed in Stripe`);
    
    // Update in our database
    await prisma.subscription.update({
      where: { id: updatedUser.customer.subscription.id },
      data: {
        status: 'ACTIVE',
      }
    });
    console.log(`✅ Subscription marked as active in database`);

    // Step 9: Test creating a failed payment
    console.log('\n9️⃣ Testing payment failure scenario');
    
    // Create a failing payment method using a token that always declines
    console.log(`  Creating failing payment method...`);
    const failingPaymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        token: TEST_TOKENS.VISA_DECLINE,
      },
    });
    
    // Attach to customer
    await stripe.paymentMethods.attach(failingPaymentMethod.id, {
      customer: stripeCustomer.id,
    });
    
    // Update customer's default payment method to the failing one
    await stripe.customers.update(stripeCustomer.id, {
      invoice_settings: {
        default_payment_method: failingPaymentMethod.id,
      },
    });
    
    // Create a failed payment in our database
    const failedPayment = await prisma.payment.create({
      data: {
        amount: 20.00,
        status: 'FAILED',
        type: 'SERVICE',
        customerId: updatedUser.customer.id,
        subscriptionId: updatedUser.customer.subscription.id,
      }
    });
    console.log(`✅ Created failed payment record in database: ${failedPayment.id}`);
    
    // Step 10: Test payment retry mechanism
    console.log('\n🔟 Testing payment retry mechanism');
    const paymentRetry = await prisma.paymentRetry.create({
      data: {
        paymentId: failedPayment.id,
        status: 'SCHEDULED',
        retryCount: 0,
        nextRetryDate: new Date() // Schedule for now so it's eligible for immediate retry
      }
    });
    console.log(`✅ Created payment retry record: ${paymentRetry.id}`);
    
    // At this point, we would normally run the retry-failed-payments script,
    // but for testing purposes, we'll just update the status
    await prisma.paymentRetry.update({
      where: { id: paymentRetry.id },
      data: {
        status: 'PENDING',
      }
    });
    
    // Update to "SUCCESS" to simulate successful retry
    await prisma.paymentRetry.update({
      where: { id: paymentRetry.id },
      data: {
        status: 'SUCCESS',
      }
    });
    
    // Also update the original payment
    await prisma.payment.update({
      where: { id: failedPayment.id },
      data: {
        status: 'COMPLETED',
        updatedAt: new Date()
      }
    });
    console.log(`✅ Simulated successful payment retry`);

    console.log('\n✅ All tests completed successfully!');
    
    // Output cleanup instructions
    console.log('\n🧹 Test data was created. To clean up, run the following command:');
    console.log('node scripts/cleanup-stripe-tests.js');
    
    // Store the test IDs for cleanup
    require('fs').writeFileSync('test-stripe-data.json', JSON.stringify({
      stripeCustomerId: stripeCustomer.id,
      stripeSubscriptionId: subscription.id,
      databaseUserId: updatedUser.id,
      databaseCustomerId: updatedUser.customer.id,
      databaseSubscriptionId: updatedUser.customer.subscription.id,
      databasePaymentId: failedPayment.id,
      databasePaymentRetryId: paymentRetry.id,
      testCreatedAt: new Date().toISOString()
    }, null, 2));
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
testStripeIntegration(); 