#!/usr/bin/env node

const REQUIRED_VERCEL_ENV = [
  'DATABASE_URL',
  'DIRECT_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'EMAIL_FROM',
  'NEXT_PUBLIC_APP_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
];

async function main() {
  console.log('🔍 Checking Vercel environment variables...\n');

  // Check for required environment variables
  const missingVars = [];
  for (const envVar of REQUIRED_VERCEL_ENV) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    console.error('❌ Missing required Vercel environment variables:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    process.exit(1);
  }

  console.log('✅ All Vercel environment variables are set!\n');
}

main().catch(error => {
  console.error('❌ Vercel environment check failed:', error);
  process.exit(1);
}); 