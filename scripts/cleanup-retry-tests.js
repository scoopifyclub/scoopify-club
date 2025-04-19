// scripts/cleanup-retry-tests.js
// This script cleans up test data created by the test-payment-retry.js script

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

async function cleanupRetryTests() {
  console.log('🧹 Cleaning up payment retry test data');
  
  try {
    // Check if test data file exists
    const testDataPath = path.join(process.cwd(), 'test-retry-data.json');
    if (!fs.existsSync(testDataPath)) {
      console.log('⚠️ No test retry data file found at', testDataPath);
      return;
    }
    
    // Load test data
    const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
    console.log('📂 Found test data created at:', testData.testCreatedAt);
    
    // 1. Delete Stripe customer if it exists
    if (testData.stripeCustomerId) {
      try {
        console.log(`Deleting Stripe customer: ${testData.stripeCustomerId}`);
        await stripe.customers.del(testData.stripeCustomerId);
        console.log('✅ Stripe customer deleted');
      } catch (error) {
        console.log(`⚠️ Could not delete Stripe customer: ${error.message}`);
      }
    }
    
    // 2. Delete test records from the database
    console.log('Deleting database records...');
    
    // Delete payment retry record
    if (testData.databasePaymentRetryId) {
      await prisma.paymentRetry.delete({
        where: { id: testData.databasePaymentRetryId }
      }).catch(e => console.log(`⚠️ Could not delete payment retry: ${e.message}`));
      console.log('✅ Deleted payment retry record');
    }
    
    // Delete payment record
    if (testData.databasePaymentId) {
      await prisma.payment.delete({
        where: { id: testData.databasePaymentId }
      }).catch(e => console.log(`⚠️ Could not delete payment: ${e.message}`));
      console.log('✅ Deleted payment record');
    }
    
    // Delete subscription
    if (testData.databaseSubscriptionId) {
      await prisma.subscription.delete({
        where: { id: testData.databaseSubscriptionId }
      }).catch(e => console.log(`⚠️ Could not delete subscription: ${e.message}`));
      console.log('✅ Deleted subscription record');
    }
    
    // Delete customer
    if (testData.databaseCustomerId) {
      await prisma.customer.delete({
        where: { id: testData.databaseCustomerId }
      }).catch(e => console.log(`⚠️ Could not delete customer: ${e.message}`));
      console.log('✅ Deleted customer record');
    }
    
    // Delete user
    if (testData.databaseUserId) {
      await prisma.user.delete({
        where: { id: testData.databaseUserId }
      }).catch(e => console.log(`⚠️ Could not delete user: ${e.message}`));
      console.log('✅ Deleted user record');
    }
    
    // Delete the test data file
    fs.unlinkSync(testDataPath);
    console.log('✅ Deleted test data file');
    
    console.log('🎉 Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupRetryTests(); 