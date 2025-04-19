// scripts/deploy-to-vercel.js
// This script helps prepare and deploy the app to Vercel

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing deployment to Vercel...');

// 1. Create a migration for PostgreSQL if needed
console.log('📊 Checking for pending database changes...');

try {
  // This command will create a migration if there are schema changes
  execSync('npx prisma migrate dev --name production-deploy --create-only', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_PROVIDER: 'postgresql' 
    }
  });
  console.log('✅ Migration preparation complete');
} catch (error) {
  console.error('❌ Migration preparation failed:', error.message);
  process.exit(1);
}

// 2. Run other pre-deployment checks
console.log('🧪 Running tests...');
try {
  execSync('npm run test', { stdio: 'inherit' });
  console.log('✅ Tests passed');
} catch (error) {
  console.error('❌ Tests failed:', error.message);
  process.exit(1);
}

// 3. Deploy to Vercel (if vercel CLI is installed)
console.log('🚀 Deploying to Vercel...');
try {
  // Check if production flag is provided
  const isProduction = process.argv.includes('--production');
  
  if (isProduction) {
    execSync('vercel --prod', { stdio: 'inherit' });
    console.log('✅ Production deployment completed');
  } else {
    execSync('vercel', { stdio: 'inherit' });
    console.log('✅ Preview deployment completed');
    console.log('To deploy to production, run: node scripts/deploy-to-vercel.js --production');
  }
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.log('If you don\'t have Vercel CLI installed, install it with: npm i -g vercel');
  process.exit(1);
} 