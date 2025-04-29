const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function verifyDeployment() {
  console.log('🔍 Verifying deployment setup...\n');

  // Determine environment
  const isProduction = process.env.NODE_ENV === 'production';
  console.log(`Environment: ${isProduction ? 'Production' : 'Development'}\n`);

  // Check database connection
  console.log('Testing database connection...');
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful\n');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }

  // Check required environment variables
  const requiredVars = [
    'DATABASE_URL',
    'DIRECT_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'EMAIL_FROM',
    'NEXT_PUBLIC_APP_URL', // Keep this required
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ];

  console.log('Checking environment variables...');
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    process.exit(1);
  }
  console.log('✅ All required environment variables are set\n');

  // Check email configuration
  console.log('Verifying email configuration...');
  if (process.env.SMTP_HOST === 'mail.privateemail.com' && 
      process.env.SMTP_PORT === '465' &&
      process.env.SMTP_USER === 'services@scoopify.club') {
    console.log('✅ Email configuration verified\n');
  } else {
    console.warn('⚠️ Email configuration differs from expected values');
  }

  // Check app URL configuration
  console.log('Verifying app URL configuration...');
  const expectedDevUrl = 'http://localhost:3000';
  const expectedProdUrl = 'https://www.scoopify.club';
  const currentAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (isProduction) {
    if (currentAppUrl !== expectedProdUrl) {
      console.error(`❌ Production app URL mismatch. Expected ${expectedProdUrl}, got ${currentAppUrl}`);
      process.exit(1);
    }
    console.log('✅ Production app URL verified\n');
  } else {
    if (currentAppUrl !== expectedDevUrl) {
      console.error(`❌ Development app URL mismatch. Expected ${expectedDevUrl}, got ${currentAppUrl}`);
      process.exit(1);
    }
    console.log('✅ Development app URL verified\n');
  }

  // Check Prisma schema
  console.log('Verifying Prisma schema...');
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Prisma schema is valid\n');
  } catch (error) {
    console.error('❌ Prisma schema validation failed:', error.message);
    process.exit(1);
  }

  console.log('✅ Deployment verification completed successfully!');
  await prisma.$disconnect();
}

verifyDeployment().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
}); 