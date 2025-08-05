#!/usr/bin/env node

/**
 * Verification script for ScoopifyClub automation setup
 * This script tests that all automation components are properly configured
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 ScoopifyClub Automation Setup Verification');
console.log('============================================\n');

// Files that should exist
const requiredFiles = [
  // Automation Systems
  'src/app/api/cron/automated-employee-recruitment/route.js',
  'src/app/api/cron/automated-customer-acquisition/route.js',
  'src/app/api/cron/business-intelligence/route.js',
  
  // Dashboard & UI
  'src/app/admin/automation-dashboard/page.jsx',
  'src/app/admin/dashboard/automation/page.jsx',
  
  // Supporting APIs
  'src/app/api/admin/automation-status/route.js',
  'src/app/api/admin/system-metrics/route.js',
  'src/app/api/admin/recent-activity/route.js',
  'src/app/api/admin/trigger-automation/route.js',
  
  // Documentation & Setup
  'docs/AUTOMATION_INTEGRATION.md',
  'scripts/setup-automation-cron.js',
  'scripts/health-check.sh',
  'automation.env.example',
  'SELF_RUNNING_BUSINESS_SUMMARY.md'
];

// Files that should be updated
const updatedFiles = [
  'src/app/admin/dashboard/layout.jsx',
  'PRODUCTION_READINESS.md'
];

function checkFileExists(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  const exists = fs.existsSync(fullPath);
  return { exists, path: filePath };
}

function verifyFileStructure() {
  console.log('📁 Verifying File Structure:');
  console.log('============================\n');
  
  let allFilesExist = true;
  
  // Check required files
  console.log('Required Files:');
  requiredFiles.forEach(filePath => {
    const { exists, path } = checkFileExists(filePath);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${path}`);
    if (!exists) allFilesExist = false;
  });
  
  console.log('\nUpdated Files:');
  updatedFiles.forEach(filePath => {
    const { exists, path } = checkFileExists(filePath);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${path}`);
    if (!exists) allFilesExist = false;
  });
  
  console.log('');
  return allFilesExist;
}

function verifyPackageJson() {
  console.log('📦 Verifying Package Configuration:');
  console.log('===================================\n');
  
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    console.log('✅ package.json found');
    console.log(`   Type: ${packageJson.type || 'commonjs'}`);
    console.log(`   Dependencies: ${Object.keys(packageJson.dependencies || {}).length} packages`);
    console.log(`   Dev Dependencies: ${Object.keys(packageJson.devDependencies || {}).length} packages`);
    
    // Check for required dependencies
    const requiredDeps = ['next', 'react', '@prisma/client'];
    const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies?.[dep]);
    
    if (missingDeps.length > 0) {
      console.log(`   ⚠️  Missing dependencies: ${missingDeps.join(', ')}`);
      return false;
    }
    
    console.log('   ✅ All required dependencies present');
    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Error reading package.json:', error.message);
    console.log('');
    return false;
  }
}

function verifyEnvironmentTemplate() {
  console.log('🔧 Verifying Environment Template:');
  console.log('==================================\n');
  
  try {
    const envPath = path.join(process.cwd(), 'automation.env.example');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'STRIPE_SECRET_KEY',
      'AUTOMATION_ENABLED'
    ];
    
    console.log('✅ automation.env.example found');
    
    const missingVars = requiredVars.filter(varName => !envContent.includes(varName));
    
    if (missingVars.length > 0) {
      console.log(`   ⚠️  Missing environment variables: ${missingVars.join(', ')}`);
      return false;
    }
    
    console.log('   ✅ All required environment variables present');
    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Error reading automation.env.example:', error.message);
    console.log('');
    return false;
  }
}

function generateDeploymentChecklist() {
  console.log('🚀 Deployment Checklist:');
  console.log('========================\n');
  
  console.log('1. Environment Setup:');
  console.log('   □ Copy automation.env.example to your production environment');
  console.log('   □ Configure DATABASE_URL for production database');
  console.log('   □ Set up Stripe API keys');
  console.log('   □ Configure JWT secrets');
  console.log('   □ Set up email service (SMTP)');
  console.log('   □ Enable automation toggles');
  console.log('');
  
  console.log('2. Cron Job Configuration:');
  console.log('   □ Choose deployment method (Vercel, GitHub Actions, traditional cron)');
  console.log('   □ Configure the 5 automation cron jobs');
  console.log('   □ Test cron job endpoints manually');
  console.log('');
  
  console.log('3. Database Setup:');
  console.log('   □ Ensure Prisma schema is up to date');
  console.log('   □ Run database migrations');
  console.log('   □ Verify SystemLog table exists for activity logging');
  console.log('');
  
  console.log('4. Testing:');
  console.log('   □ Deploy to production environment');
  console.log('   □ Test admin authentication');
  console.log('   □ Visit /admin/dashboard/automation');
  console.log('   □ Test manual automation triggers');
  console.log('   □ Run health check script');
  console.log('');
  
  console.log('5. Monitoring:');
  console.log('   □ Set up error monitoring (Sentry recommended)');
  console.log('   □ Configure alerts for automation failures');
  console.log('   □ Schedule regular dashboard reviews');
  console.log('');
}

function generateQuickStartCommands() {
  console.log('⚡ Quick Start Commands:');
  console.log('========================\n');
  
  console.log('1. Run setup script:');
  console.log('   node scripts/setup-automation-cron.js');
  console.log('');
  
  console.log('2. Test automation dashboard:');
  console.log('   npm run dev');
  console.log('   # Then visit: http://localhost:3000/admin/dashboard/automation');
  console.log('');
  
  console.log('3. Test API endpoints:');
  console.log('   curl http://localhost:3000/api/admin/automation-status');
  console.log('   curl http://localhost:3000/api/admin/system-metrics');
  console.log('   curl http://localhost:3000/api/admin/recent-activity');
  console.log('');
  
  console.log('4. Test manual triggers:');
  console.log('   curl -X POST http://localhost:3000/api/admin/trigger-automation \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"automationType": "employee-recruitment"}\'');
  console.log('');
}

function main() {
  const fileStructureOk = verifyFileStructure();
  const packageJsonOk = verifyPackageJson();
  const envTemplateOk = verifyEnvironmentTemplate();
  
  console.log('📊 Verification Summary:');
  console.log('========================\n');
  
  console.log(`File Structure: ${fileStructureOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Package Configuration: ${packageJsonOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Environment Template: ${envTemplateOk ? '✅ PASS' : '❌ FAIL'}`);
  
  const overallSuccess = fileStructureOk && packageJsonOk && envTemplateOk;
  
  console.log(`\nOverall Status: ${overallSuccess ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED'}`);
  
  if (overallSuccess) {
    console.log('\n🎉 Your automation setup is ready for deployment!');
    console.log('');
    generateDeploymentChecklist();
    generateQuickStartCommands();
  } else {
    console.log('\n⚠️  Please fix the issues above before proceeding with deployment.');
    console.log('   Check the file paths and ensure all required files are present.');
  }
  
  console.log('\n📚 Documentation:');
  console.log('   - SELF_RUNNING_BUSINESS_SUMMARY.md - Complete overview');
  console.log('   - docs/AUTOMATION_INTEGRATION.md - Detailed integration guide');
  console.log('   - PRODUCTION_READINESS.md - Production deployment guide');
  console.log('');
  
  console.log('🚀 Next Steps:');
  console.log('   1. Review the deployment checklist above');
  console.log('   2. Set up your production environment');
  console.log('   3. Configure cron jobs');
  console.log('   4. Test the automation dashboard');
  console.log('   5. Monitor system performance');
}

// Run the verification
main();

export {
  verifyFileStructure,
  verifyPackageJson,
  verifyEnvironmentTemplate,
  generateDeploymentChecklist,
  generateQuickStartCommands
}; 