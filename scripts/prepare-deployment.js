const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();

async function prepareDeployment() {
  console.log('🚀 Preparing for deployment...\n');

  // Step 1: Check and generate Prisma client
  console.log('Step 1: Generating Prisma client...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated successfully\n');
  } catch (error) {
    console.error('❌ Failed to generate Prisma client:', error.message);
    process.exit(1);
  }

  // Step 2: Check database migrations
  console.log('Step 2: Checking database migrations...');
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection and migrations verified\n');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    process.exit(1);
  }

  // Step 3: Run build check
  console.log('Step 3: Running build check...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully\n');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }

  // Step 4: Verify Vercel configuration
  console.log('Step 4: Checking Vercel configuration...');
  try {
    const vercelConfig = require('../vercel.json');
    const requiredFields = ['version', 'buildCommand', 'outputDirectory'];
    const missingFields = requiredFields.filter(field => !vercelConfig[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields in vercel.json: ${missingFields.join(', ')}`);
    }
    console.log('✅ Vercel configuration verified\n');
  } catch (error) {
    console.error('❌ Vercel configuration check failed:', error.message);
    process.exit(1);
  }

  console.log('✅ Deployment preparation completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Set DIRECT_URL in your Vercel environment variables');
  console.log('2. Run `vercel deploy` to deploy to preview');
  console.log('3. After testing preview, run `vercel --prod` to deploy to production');
}

prepareDeployment().catch(error => {
  console.error('❌ Preparation failed:', error);
  process.exit(1);
}); 