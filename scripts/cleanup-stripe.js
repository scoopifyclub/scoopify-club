#!/usr/bin/env node

import Stripe from 'stripe';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧹 Stripe Cleanup & Setup Script');
console.log('==================================\n');

// Load environment variables
const envPath = join(__dirname, '..', '.env.local');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      process.env[key.trim()] = value.trim();
    }
  });
}

if (!process.env.STRIPE_SECRET_KEY) {
  console.log('❌ STRIPE_SECRET_KEY not found in environment variables');
  console.log('Please set this variable before running the script');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function listAllProducts() {
  console.log('📋 Current Stripe Products:');
  console.log('============================\n');
  
  try {
    const products = await stripe.products.list({ limit: 100 });
    
    if (products.data.length === 0) {
      console.log('No products found in Stripe\n');
      return [];
    }
    
    for (const product of products.data) {
      console.log(`Product: ${product.name} (${product.id})`);
      console.log(`  Description: ${product.description || 'No description'}`);
      console.log(`  Active: ${product.active ? 'Yes' : 'No'}`);
      console.log(`  Created: ${new Date(product.created * 1000).toLocaleDateString()}`);
      
      // Get prices for this product
      const prices = await stripe.prices.list({ product: product.id });
      if (prices.data.length > 0) {
        console.log('  Prices:');
        for (const price of prices.data) {
          console.log(`    - ${price.id}: $${price.unit_amount / 100} ${price.currency} (${price.recurring ? 'recurring' : 'one-time'})`);
        }
      }
      console.log('');
    }
    
    return products.data;
  } catch (error) {
    console.log('❌ Error listing products:', error.message);
    return [];
  }
}

async function deleteTestProducts() {
  console.log('🗑️  Deleting Test Products:');
  console.log('============================\n');
  
  try {
    const products = await stripe.products.list({ limit: 100 });
    let deletedCount = 0;
    
    for (const product of products.data) {
      // Delete products that look like test products
      if (product.name.toLowerCase().includes('test') || 
          product.name.toLowerCase().includes('demo') ||
          product.description?.toLowerCase().includes('test') ||
          product.description?.toLowerCase().includes('demo')) {
        
        console.log(`Deleting test product: ${product.name} (${product.id})`);
        
        // Delete all prices first
        const prices = await stripe.prices.list({ product: product.id });
        for (const price of prices.data) {
          await stripe.prices.update(price.id, { active: false });
          console.log(`  - Deactivated price: ${price.id}`);
        }
        
        // Delete the product
        await stripe.products.del(product.id);
        console.log(`  ✅ Deleted product: ${product.id}`);
        deletedCount++;
      }
    }
    
    if (deletedCount === 0) {
      console.log('No test products found to delete\n');
    } else {
      console.log(`\n✅ Deleted ${deletedCount} test products\n`);
    }
    
  } catch (error) {
    console.log('❌ Error deleting test products:', error.message);
  }
}

async function createProductionProducts() {
  console.log('🏗️  Creating Production Products:');
  console.log('==================================\n');
  
  const products = [
    {
      name: 'Weekly Service - 1 Dog',
      description: 'Weekly dog waste removal service for 1 dog',
      prices: [
        { amount: 2500, currency: 'usd', recurring: { interval: 'week' }, nickname: 'Weekly 1 Dog' }
      ]
    },
    {
      name: 'Weekly Service - 2 Dogs',
      description: 'Weekly dog waste removal service for 2 dogs',
      prices: [
        { amount: 3500, currency: 'usd', recurring: { interval: 'week' }, nickname: 'Weekly 2 Dogs' }
      ]
    },
    {
      name: 'Weekly Service - 3+ Dogs',
      description: 'Weekly dog waste removal service for 3 or more dogs',
      prices: [
        { amount: 4500, currency: 'usd', recurring: { interval: 'week' }, nickname: 'Weekly 3+ Dogs' }
      ]
    },
    {
      name: 'One-Time Service - 1 Dog',
      description: 'One-time dog waste removal service for 1 dog',
      prices: [
        { amount: 5000, currency: 'usd', recurring: null, nickname: 'One-Time 1 Dog' }
      ]
    },
    {
      name: 'One-Time Service - 2 Dogs',
      description: 'One-time dog waste removal service for 2 dogs',
      prices: [
        { amount: 5000, currency: 'usd', recurring: null, nickname: 'One-Time 2 Dogs' }
      ]
    },
    {
      name: 'One-Time Service - 3+ Dogs',
      description: 'One-time dog waste removal service for 3 or more dogs',
      prices: [
        { amount: 7500, currency: 'usd', recurring: null, nickname: 'One-Time 3+ Dogs' }
      ]
    }
  ];
  
  const createdProducts = [];
  
  for (const productData of products) {
    try {
      console.log(`Creating product: ${productData.name}`);
      
      // Create the product
      const product = await stripe.products.create({
        name: productData.name,
        description: productData.description,
        active: true
      });
      
      console.log(`  ✅ Created product: ${product.id}`);
      
      // Create prices for this product
      for (const priceData of productData.prices) {
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: priceData.amount,
          currency: priceData.currency,
          recurring: priceData.recurring,
          nickname: priceData.nickname
        });
        
        console.log(`    ✅ Created price: ${price.id} - $${priceData.amount / 100}`);
        
        createdProducts.push({
          product: product,
          price: price,
          type: priceData.recurring ? 'WEEKLY' : 'ONE_TIME',
          dogs: priceData.nickname.includes('1 Dog') ? '1' : 
                priceData.nickname.includes('2 Dogs') ? '2' : '3+'
        });
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`  ❌ Error creating product ${productData.name}:`, error.message);
    }
  }
  
  return createdProducts;
}

function generateEnvVars(products) {
  console.log('🔧 Environment Variables to Set:');
  console.log('=================================\n');
  
  const envVars = {};
  
  for (const item of products) {
    const key = item.recurring ? 
      `STRIPE_WEEKLY_${item.dogs === '1' ? '1_DOG' : item.dogs === '2' ? '2_DOGS' : '3_PLUS_DOGS'}_PRICE_ID` :
      `STRIPE_ONE_TIME_${item.dogs === '1' ? '1_DOG' : item.dogs === '2' ? '2_DOGS' : '3_PLUS_DOGS'}_PRICE_ID`;
    
    envVars[key] = item.price.id;
  }
  
  for (const [key, value] of Object.entries(envVars)) {
    console.log(`${key}=${value}`);
  }
  
  console.log('\n📝 Copy these to your .env.local file and Vercel environment variables');
}

async function main() {
  try {
    console.log('Choose an action:');
    console.log('1. List current products');
    console.log('2. Delete test products');
    console.log('3. Create production products');
    console.log('4. Full cleanup and setup');
    console.log('5. Exit');
    
    // For now, let's run the full setup
    console.log('\n🔄 Running full cleanup and setup...\n');
    
    // List current products
    await listAllProducts();
    
    // Delete test products
    await deleteTestProducts();
    
    // Create production products
    const products = await createProductionProducts();
    
    if (products.length > 0) {
      // Generate environment variables
      generateEnvVars(products);
      
      console.log('\n🎉 Stripe setup completed!');
      console.log('Next steps:');
      console.log('1. Copy the environment variables above to your .env.local file');
      console.log('2. Set the same variables in your Vercel dashboard');
      console.log('3. Run: npm run setup:production');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

main();
