#!/usr/bin/env node

/**
 * GitHub Deployment Script for ScoopifyClub
 * Prepares the project for Git push and deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 ScoopifyClub GitHub Deployment Preparation');
console.log('===========================================\n');

function checkFileExists(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  return fs.existsSync(fullPath);
}

function verifyGitSetup() {
  console.log('📝 Verifying Git Setup...');
  
  const gitPath = path.join(process.cwd(), '.git');
  if (!fs.existsSync(gitPath)) {
    console.log('❌ Git repository not initialized');
    console.log('   💡 Run: git init');
    return false;
  }
  
  console.log('   ✅ Git repository initialized');
  
  // Check .gitignore
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    const essentialPatterns = [
      'node_modules',
      '.env',
      '.next',
      'dist',
      '.vercel',
      'coverage',
      '*.log'
    ];
    
    const missing = essentialPatterns.filter(pattern => !gitignoreContent.includes(pattern));
    if (missing.length > 0) {
      console.log(`   ⚠️  Missing .gitignore patterns: ${missing.join(', ')}`);
    } else {
      console.log('   ✅ .gitignore properly configured');
    }
  } else {
    console.log('   ❌ .gitignore not found');
  }
  
  console.log('');
  return true;
}

function verifyEssentialFiles() {
  console.log('📋 Verifying Essential Files...');
  
  const essentialFiles = [
    'package.json',
    'next.config.js',
    'tailwind.config.js',
    'README.md',
    '.env.example',
    'automation.env.example',
    'prisma/schema.prisma',
    'src/app/layout.jsx',
    'src/app/page.jsx'
  ];
  
  let allPresent = true;
  essentialFiles.forEach(file => {
    const exists = checkFileExists(file);
    const status = exists ? '✅' : '❌';
    console.log(`   ${status} ${file}`);
    if (!exists) allPresent = false;
  });
  
  console.log('');
  return allPresent;
}

function verifyAutomationFiles() {
  console.log('🤖 Verifying Automation Files...');
  
  const automationFiles = [
    'src/app/api/cron/automated-employee-recruitment/route.js',
    'src/app/api/cron/automated-customer-acquisition/route.js',
    'src/app/api/cron/business-intelligence/route.js',
    'src/app/admin/dashboard/automation/page.jsx',
    'src/app/api/admin/automation-status/route.js',
    'src/app/api/admin/system-metrics/route.js',
    'src/app/api/admin/recent-activity/route.js',
    'src/app/api/admin/trigger-automation/route.js',
    'docs/AUTOMATION_INTEGRATION.md',
    'SELF_RUNNING_BUSINESS_SUMMARY.md',
    'DEPLOYMENT_READY.md',
    'QUICK_START.md'
  ];
  
  let allPresent = true;
  automationFiles.forEach(file => {
    const exists = checkFileExists(file);
    const status = exists ? '✅' : '❌';
    console.log(`   ${status} ${file}`);
    if (!exists) allPresent = false;
  });
  
  console.log('');
  return allPresent;
}

function checkForSensitiveFiles() {
  console.log('🔒 Checking for Sensitive Files...');
  
  const sensitiveFiles = [
    '.env',
    '.env.local',
    '.env.production',
    '*.key',
    '*.pem',
    'secrets.json',
    'credentials.json'
  ];
  
  let foundSensitive = false;
  sensitiveFiles.forEach(pattern => {
    // Simple check for common sensitive files
    if (checkFileExists(pattern)) {
      console.log(`   ⚠️  Found sensitive file: ${pattern}`);
      foundSensitive = true;
    }
  });
  
  if (!foundSensitive) {
    console.log('   ✅ No obvious sensitive files found');
  }
  
  console.log('');
  return !foundSensitive;
}

function generateDeploymentCommands() {
  console.log('📋 GitHub Deployment Commands:');
  console.log('==============================\n');
  
  console.log('1. Initialize Git (if not already done):');
  console.log('   git init');
  console.log('');
  
  console.log('2. Add all files:');
  console.log('   git add .');
  console.log('');
  
  console.log('3. Create initial commit:');
  console.log('   git commit -m "Initial commit: ScoopifyClub self-running business automation"');
  console.log('');
  
  console.log('4. Add remote repository (replace with your GitHub repo URL):');
  console.log('   git remote add origin https://github.com/yourusername/scoopifyclub.git');
  console.log('');
  
  console.log('5. Push to GitHub:');
  console.log('   git push -u origin main');
  console.log('');
  
  console.log('6. Deploy to Vercel:');
  console.log('   npx vercel --prod');
  console.log('');
  
  console.log('7. Set up environment variables in Vercel:');
  console.log('   - Copy from automation.env.example');
  console.log('   - Configure DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY');
  console.log('');
  
  console.log('8. Configure cron jobs in vercel.json:');
  console.log('   Add the cron configuration to your vercel.json file');
  console.log('');
}

function generateVercelConfig() {
  console.log('⚙️  Vercel Configuration:');
  console.log('========================\n');
  
  const vercelConfig = {
    "crons": [
      {
        "path": "/api/cron/create-weekly-services",
        "schedule": "0 9 * * 1"
      },
      {
        "path": "/api/cron/automated-employee-recruitment",
        "schedule": "0 10 * * 2"
      },
      {
        "path": "/api/cron/automated-customer-acquisition",
        "schedule": "0 11 * * 3"
      },
      {
        "path": "/api/cron/business-intelligence",
        "schedule": "0 8 * * 6"
      },
      {
        "path": "/api/cron/process-employee-payouts",
        "schedule": "0 12 * * 5"
      }
    ]
  };
  
  console.log('Add this to your vercel.json:');
  console.log(JSON.stringify(vercelConfig, null, 2));
  console.log('');
}

function generateEnvironmentTemplate() {
  console.log('🔧 Environment Variables Template:');
  console.log('==================================\n');
  
  console.log('Copy these to your Vercel environment variables:');
  console.log('');
  console.log('DATABASE_URL=your_production_database_url');
  console.log('JWT_SECRET=your_jwt_secret_key');
  console.log('STRIPE_SECRET_KEY=your_stripe_secret_key');
  console.log('STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key');
  console.log('NEXTAUTH_SECRET=your_nextauth_secret');
  console.log('NEXTAUTH_URL=https://your-domain.vercel.app');
  console.log('AUTOMATION_ENABLED=true');
  console.log('SMTP_HOST=your_smtp_host');
  console.log('SMTP_PORT=587');
  console.log('SMTP_USER=your_smtp_user');
  console.log('SMTP_PASS=your_smtp_password');
  console.log('');
}

function main() {
  console.log('🔍 Starting GitHub deployment preparation...\n');
  
  // Run verifications
  const gitOk = verifyGitSetup();
  const filesOk = verifyEssentialFiles();
  const automationOk = verifyAutomationFiles();
  const securityOk = checkForSensitiveFiles();
  
  console.log('📊 Verification Summary:');
  console.log('========================\n');
  
  console.log(`Git Setup: ${gitOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Essential Files: ${filesOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Automation Files: ${automationOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Security Check: ${securityOk ? '✅ PASS' : '❌ FAIL'}`);
  
  const overallSuccess = gitOk && filesOk && automationOk && securityOk;
  
  console.log(`\nOverall Status: ${overallSuccess ? '✅ READY FOR DEPLOYMENT' : '❌ ISSUES TO FIX'}`);
  
  if (overallSuccess) {
    console.log('\n🎉 Your project is ready for GitHub deployment!');
    console.log('');
    generateDeploymentCommands();
    generateVercelConfig();
    generateEnvironmentTemplate();
  } else {
    console.log('\n⚠️  Please fix the issues above before deploying.');
  }
  
  console.log('📚 Documentation:');
  console.log('   - DEPLOYMENT_READY.md - Complete deployment guide');
  console.log('   - QUICK_START.md - Quick start guide');
  console.log('   - SELF_RUNNING_BUSINESS_SUMMARY.md - Project overview');
  console.log('');
  
  console.log('🚀 Next Steps:');
  console.log('   1. Fix any issues identified above');
  console.log('   2. Test the application locally: npm run dev');
  console.log('   3. Follow the deployment commands above');
  console.log('   4. Configure environment variables in Vercel');
  console.log('   5. Set up cron jobs for automation');
  console.log('');
}

// Run the deployment preparation
main();

export {
  verifyGitSetup,
  verifyEssentialFiles,
  verifyAutomationFiles,
  checkForSensitiveFiles,
  generateDeploymentCommands,
  generateVercelConfig,
  generateEnvironmentTemplate
}; 