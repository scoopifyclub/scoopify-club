require('dotenv').config();
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testStripeIntegration() {
  try {
    // Test 1: Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000, // $20.00
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        serviceId: 'test_service_123',
        customerId: 'test_customer_123'
      }
    });

    console.log('✅ Payment Intent created successfully:', paymentIntent.id);

    // Test 2: Create a product and price for subscriptions
    const product = await stripe.products.create({
      name: 'Weekly Service',
      description: 'Weekly dog waste removal service'
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 2000,
      currency: 'usd',
      recurring: {
        interval: 'week'
      }
    });

    console.log('✅ Subscription product and price created successfully');
    console.log('Product ID:', product.id);
    console.log('Price ID:', price.id);

    // Test 3: Create a customer
    const customer = await stripe.customers.create({
      email: 'test@scoopifyclub.com',
      description: 'Test Customer for Scoopify Club'
    });

    console.log('✅ Customer created successfully:', customer.id);

    return true;
  } catch (error) {
    console.error('❌ Stripe integration test failed:', error);
    return false;
  }
}

// Run the test
testStripeIntegration(); 