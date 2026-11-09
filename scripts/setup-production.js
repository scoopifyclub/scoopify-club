#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

console.log('🚀 Scoopify Club Production Setup Script');
console.log('==========================================\n');

async function checkEnvironment() {
  console.log('1️⃣ Checking environment variables...');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_WEEKLY_1_DOG_PRICE_ID',
    'STRIPE_WEEKLY_2_DOGS_PRICE_ID',
    'STRIPE_WEEKLY_3_PLUS_DOGS_PRICE_ID',
    'STRIPE_ONE_TIME_1_DOG_PRICE_ID',
    'STRIPE_ONE_TIME_2_DOGS_PRICE_ID',
    'STRIPE_ONE_TIME_3_PLUS_DOGS_PRICE_ID',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'EMAIL_FROM'
  ];

  const missing = [];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.log('❌ Missing required environment variables:');
    missing.forEach(envVar => console.log(`   - ${envVar}`));
    console.log('\nPlease set these environment variables before continuing.');
    return false;
  }

  console.log('✅ All required environment variables are set!\n');
  return true;
}

async function setupDatabase() {
  console.log('2️⃣ Setting up database...');
  
  try {
    // Generate Prisma client
    console.log('   Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('   ✅ Prisma client generated');

    // An existing database must be baselined first (docs/database-migrations.md).
    console.log('   Applying migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('   ✅ Database schema updated');

    // Seed the database
    console.log('   Seeding database...');
    execSync('npx prisma db seed', { stdio: 'inherit' });
    console.log('   ✅ Database seeded');

    console.log('✅ Database setup completed!\n');
    return true;
  } catch (error) {
    console.log('❌ Database setup failed:', error.message);
    return false;
  }
}

async function verifyDatabaseConnection() {
  console.log('3️⃣ Verifying database connection...');
  
  try {
    await prisma.$connect();
    console.log('   ✅ Database connection successful');

    // Check if tables exist
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log(`   ✅ Found ${tableCount[0].count} tables`);

    // Check if service plans exist
    const servicePlanCount = await prisma.servicePlan.count();
    console.log(`   ✅ Found ${servicePlanCount} service plans`);

    // Check if users exist
    const userCount = await prisma.user.count();
    console.log(`   ✅ Found ${userCount} users`);

    console.log('✅ Database verification completed!\n');
    return true;
  } catch (error) {
    console.log('❌ Database verification failed:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function checkStripeProducts() {
  console.log('4️⃣ Checking Stripe configuration...');
  
  try {
    const stripe = new (await import('stripe')).default(process.env.STRIPE_SECRET_KEY);
    
    // Check if price IDs exist
    const priceIds = [
      process.env.STRIPE_WEEKLY_1_DOG_PRICE_ID,
      process.env.STRIPE_WEEKLY_2_DOGS_PRICE_ID,
      process.env.STRIPE_WEEKLY_3_PLUS_DOGS_PRICE_ID,
      process.env.STRIPE_ONE_TIME_1_DOG_PRICE_ID,
      process.env.STRIPE_ONE_TIME_2_DOGS_PRICE_ID,
      process.env.STRIPE_ONE_TIME_3_PLUS_DOGS_PRICE_ID
    ];

    for (const priceId of priceIds) {
      if (priceId) {
        try {
          const price = await stripe.prices.retrieve(priceId);
          console.log(`   ✅ Price ${priceId}: ${price.nickname || 'Unnamed'} - $${price.unit_amount / 100}`);
        } catch (error) {
          console.log(`   ❌ Price ${priceId}: Not found in Stripe`);
        }
      }
    }

    console.log('✅ Stripe configuration check completed!\n');
    return true;
  } catch (error) {
    console.log('❌ Stripe configuration check failed:', error.message);
    return false;
  }
}

function showNextSteps() {
  console.log('🎯 NEXT STEPS FOR LAUNCH:');
  console.log('==========================\n');
  
  console.log('1. 🚀 Deploy to Vercel:');
  console.log('   npm run vercel:deploy\n');
  
  console.log('2. 🔐 Set GitHub Secrets for Cron Jobs:');
  console.log('   - CRON_SECRET: Your 32-character secret');
  console.log('   - CRON_API_KEY: Your cron API key');
  console.log('   - VERCEL_URL: Your Vercel app URL\n');
  
  console.log('3. 🧪 Test the App:');
  console.log('   - Test customer signup');
  console.log('   - Test scooper login');
  console.log('   - Test job claiming');
  console.log('   - Test Stripe payments\n');
  
  console.log('4. 📧 Verify Email Setup:');
  console.log('   - Test password reset emails');
  console.log('   - Test service notifications\n');
  
  console.log('5. 🔄 Monitor Cron Jobs:');
  console.log('   - Check GitHub Actions for cron job success');
  console.log('   - Monitor Vercel logs for any errors\n');
  
  console.log('🎉 Your app should be ready for customers!');
}

async function main() {
  try {
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

    const envOk = await checkEnvironment();
    if (!envOk) {
      process.exit(1);
    }

    const dbOk = await setupDatabase();
    if (!dbOk) {
      process.exit(1);
    }

    const verifyOk = await verifyDatabaseConnection();
    if (!verifyOk) {
      process.exit(1);
    }

    const stripeOk = await checkStripeProducts();
    if (!stripeOk) {
      console.log('⚠️  Stripe issues detected - fix before launch\n');
    }

    showNextSteps();
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

main(); 