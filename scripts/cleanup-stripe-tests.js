// scripts/cleanup-stripe-tests.js
// This script cleans up test data created by test-stripe-integration.js

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

async function cleanupTestData() {
  console.log('🧹 Starting cleanup of Stripe test data');
  console.log(`Using Stripe API Key: ${process.env.STRIPE_SECRET_KEY.substring(0, 7)}...${process.env.STRIPE_SECRET_KEY.substring(process.env.STRIPE_SECRET_KEY.length - 4)}`);

  try {
    // Check if test data file exists
    const testDataPath = path.join(process.cwd(), 'test-stripe-data.json');
    if (!fs.existsSync(testDataPath)) {
      console.log('❌ No test data file found. Run test-stripe-integration.js first.');
      return;
    }

    // Load test data
    const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
    console.log('📂 Loaded test data created at:', testData.testCreatedAt);

    // 1. Clean up database data
    console.log('\n1️⃣ Cleaning up database records');
    
    // Delete payment retry
    if (testData.databasePaymentRetryId) {
      await prisma.paymentRetry.delete({
        where: { id: testData.databasePaymentRetryId }
      }).catch(e => console.log(`  Note: Could not delete payment retry: ${e.message}`));
      console.log(`  ✅ Deleted payment retry: ${testData.databasePaymentRetryId}`);
    }
    
    // Delete payment
    if (testData.databasePaymentId) {
      await prisma.payment.delete({
        where: { id: testData.databasePaymentId }
      }).catch(e => console.log(`  Note: Could not delete payment: ${e.message}`));
      console.log(`  ✅ Deleted payment: ${testData.databasePaymentId}`);
    }
    
    // Delete subscription
    if (testData.databaseSubscriptionId) {
      await prisma.subscription.delete({
        where: { id: testData.databaseSubscriptionId }
      }).catch(e => console.log(`  Note: Could not delete subscription: ${e.message}`));
      console.log(`  ✅ Deleted subscription: ${testData.databaseSubscriptionId}`);
    }
    
    // Delete customer
    if (testData.databaseCustomerId) {
      await prisma.customer.delete({
        where: { id: testData.databaseCustomerId }
      }).catch(e => console.log(`  Note: Could not delete customer: ${e.message}`));
      console.log(`  ✅ Deleted customer: ${testData.databaseCustomerId}`);
    }
    
    // Delete user
    if (testData.databaseUserId) {
      await prisma.user.delete({
        where: { id: testData.databaseUserId }
      }).catch(e => console.log(`  Note: Could not delete user: ${e.message}`));
      console.log(`  ✅ Deleted user: ${testData.databaseUserId}`);
    }
    
    // 2. Clean up Stripe data
    console.log('\n2️⃣ Cleaning up Stripe data');
    
    // Cancel subscription
    if (testData.stripeSubscriptionId) {
      await stripe.subscriptions.del(testData.stripeSubscriptionId)
        .catch(e => console.log(`  Note: Could not delete subscription: ${e.message}`));
      console.log(`  ✅ Cancelled subscription: ${testData.stripeSubscriptionId}`);
    }
    
    // Delete customer (this will also delete attached payment methods)
    if (testData.stripeCustomerId) {
      await stripe.customers.del(testData.stripeCustomerId)
        .catch(e => console.log(`  Note: Could not delete customer: ${e.message}`));
      console.log(`  ✅ Deleted customer: ${testData.stripeCustomerId}`);
    }
    
    // 3. Delete test data file
    fs.unlinkSync(testDataPath);
    console.log('\n✅ Deleted test data file');
    
    console.log('\n🎉 Cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupTestData(); 