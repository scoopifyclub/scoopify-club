// scripts/update-customer-stripe-ids.js
// This script updates existing customers with their Stripe IDs

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

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function updateCustomerStripeIds() {
  console.log('🔄 Updating customer Stripe IDs...');
  console.log(`Using Stripe API Key: ${process.env.STRIPE_SECRET_KEY.substring(0, 7)}...${process.env.STRIPE_SECRET_KEY.substring(process.env.STRIPE_SECRET_KEY.length - 4)}`);
  
  try {
    // Get all customers from Stripe
    console.log('\n1️⃣ Fetching customers from Stripe');
    const stripeCustomers = await stripe.customers.list({
      limit: 100,
    });
    
    console.log(`Found ${stripeCustomers.data.length} customers in Stripe`);
    
    // Get all customers from the database
    console.log('\n2️⃣ Fetching customers from database');
    const dbCustomers = await prisma.customer.findMany({
      include: {
        user: true
      }
    });
    
    console.log(`Found ${dbCustomers.length} customers in database`);
    
    // Match customers by email and update Stripe IDs
    console.log('\n3️⃣ Matching customers and updating Stripe IDs');
    let updatedCount = 0;
    
    for (const dbCustomer of dbCustomers) {
      const email = dbCustomer.user?.email;
      
      if (!email) {
        console.log(`⚠️ Customer ${dbCustomer.id} has no email, skipping`);
        continue;
      }
      
      // Find matching Stripe customer
      const matchingStripeCustomer = stripeCustomers.data.find(
        sc => sc.email === email
      );
      
      if (matchingStripeCustomer) {
        // Update the customer with the Stripe ID
        await prisma.customer.update({
          where: { id: dbCustomer.id },
          data: { stripeCustomerId: matchingStripeCustomer.id }
        });
        
        console.log(`✅ Updated customer ${dbCustomer.id} with Stripe ID ${matchingStripeCustomer.id}`);
        updatedCount++;
      } else {
        console.log(`⚠️ No matching Stripe customer found for ${email}`);
      }
    }
    
    console.log(`\n✅ Updated ${updatedCount} customers with Stripe IDs`);
    
  } catch (error) {
    console.error('\n❌ Error updating customer Stripe IDs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateCustomerStripeIds()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 