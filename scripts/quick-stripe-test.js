// scripts/quick-stripe-test.js
// A simple script to test basic Stripe API connectivity

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

const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function testStripeConnection() {
  console.log('🔄 Testing Stripe API connection...');
  console.log(`Using Stripe API Key: ${process.env.STRIPE_SECRET_KEY.substring(0, 7)}...${process.env.STRIPE_SECRET_KEY.substring(process.env.STRIPE_SECRET_KEY.length - 4)}`);
  
  try {
    // Step 1: Check if we can connect to Stripe by listing products
    console.log('\n1️⃣ Checking connection by retrieving products');
    const products = await stripe.products.list({ limit: 3 });
    console.log(`✅ Successfully connected to Stripe API`);
    console.log(`   Retrieved ${products.data.length} products`);
    
    // Step 2: Test creating a payment intent
    console.log('\n2️⃣ Testing payment intent creation');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // $10.00
      currency: 'usd',
      payment_method_types: ['card'],
      description: 'Test payment intent',
      metadata: {
        test: 'true',
        created_by: 'quick_test_script'
      }
    });
    console.log(`✅ Successfully created payment intent: ${paymentIntent.id}`);
    console.log(`   Status: ${paymentIntent.status}`);
    
    // Step 3: Test retrieving payment intent
    console.log('\n3️⃣ Testing payment intent retrieval');
    const retrievedIntent = await stripe.paymentIntents.retrieve(paymentIntent.id);
    console.log(`✅ Successfully retrieved payment intent: ${retrievedIntent.id}`);
    
    // Step 4: Test cancelling payment intent
    console.log('\n4️⃣ Testing payment intent cancellation');
    const cancelledIntent = await stripe.paymentIntents.cancel(paymentIntent.id);
    console.log(`✅ Successfully cancelled payment intent: ${cancelledIntent.id}`);
    console.log(`   New status: ${cancelledIntent.status}`);
    
    // Test complete
    console.log('\n✅ All Stripe API tests completed successfully!');
    console.log('Your Stripe integration appears to be working correctly.');
    
    return true;
  } catch (error) {
    console.error('\n❌ Stripe API test failed:', error);
    return false;
  }
}

// Run the test
testStripeConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 