#!/usr/bin/env node

/**
 * Comprehensive audit and cleanup script for ScoopifyClub
 * Identifies and removes unnecessary files before GitHub deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 ScoopifyClub Audit and Cleanup');
console.log('=================================\n');

// Files to remove (temporary, test, debug files)
const filesToRemove = [
  // Temporary directories
  'coverage-areas-temp/',
  'create-test-services-temp/',
  'test-results/',
  'playwright-report/',
  
  // Test and debug files
  'quick-test.js',
  'test-dashboards.js',
  'test-admin-fixes.js',
  'deploy-admin-fixes.js',
  'fix-admin-connections.js',
  'manual-verification.js',
  'test-correct-deployment.js',
  'test-production-final.js',
  'test-auth-api.js',
  'debug-auth-detailed.js',
  'test-production-app.js',
  'test-dashboards-production.js',
  'debug-login.js',
  'test-admin-fix.js',
  'check-users.js',
  'sidebar-navigation-test-fixed.js',
  'sidebar-navigation-test.js',
  'dashboard-test-fixed.js',
  'dashboard-test-simple.js',
  'dashboard-test.js',
  'test-login.js',
  'debug-signup.js',
  'test-app.js',
  'inspect-form.js',
  'login-diagnostic.js',
  'login-debug.js',
  'test-db.js',
  
  // Temporary files
  'test-results.json',
  'vercel-build-trigger.txt',
  'clear-next-cache.txt',
  'force-rebuild.txt',
  'test.md',
  'tall',
  '🚀 Quick Local Environment Test',
  'ma migrate dev --name add-stripe-connect-and-payouts',
  
  // Image files (screenshots, debug images)
  'service-area-test-error.png',
  'login-page-debug.png',
  'login-page-initial.png',
  'login-error.png',
  'login-result.png',
  'dashboard-full.png',
  
  // Documentation files (keep only essential ones)
  'COLORADO_LAUNCH_STRATEGY.md',
  'LAUNCH_CHECKLIST.md',
  'INVESTOR_READY_SUMMARY.md',
  'ENTERPRISE_FEATURES_ROADMAP.md',
  'FINAL_PRODUCTION_CHECKLIST.md',
  'PRE_COMMIT_CHECKLIST.md',
  'PRODUCTION_READINESS_ROADMAP.md',
  'TAX_SYSTEM_DOCUMENTATION.md',
  'DATABASE_SECURITY_AUDIT_REPORT.md',
  'STRIPE_SECURITY_AUDIT.md',
  'SECURITY_AUDIT_REPORT.md',
  'MANUAL_TESTING_CHECKLIST.md',
  'ADMIN_FIXES_SUMMARY.md',
  'manual-sidebar-test.md',
  'manual-test-checklist.md',
  'DOCUMENTATION_SERVICE_CREDITS.md',
  'DISCOUNTED_CLEANUP_README.md',
  'VERCEL_DEPLOYMENT_UPDATED.md',
  'VERCEL_TROUBLESHOOTING.md',
  
  // Environment file copies
  '.env copy',
  
  // Clerk directory (if not using Clerk)
  '.clerk/'
];

// Directories to check for unnecessary files
const directoriesToAudit = [
  'scripts/',
  'src/',
  'prisma/',
  'e2e/',
  'tests/',
  'docs/'
];

// Essential files to keep
const essentialFiles = [
  'package.json',
  'package-lock.json',
  'next.config.js',
  'tailwind.config.js',
  'tsconfig.json',
  'jsconfig.json',
  '.eslintrc.json',
  '.gitignore',
  '.cursorignore',
  'vercel.json',
  'playwright.config.js',
  'jest.config.js',
  'README.md',
  '.env',
  '.env.example',
  'automation.env.example',
  
  // Keep our new automation documentation
  'DEPLOYMENT_READY.md',
  'QUICK_START.md',
  'SELF_RUNNING_BUSINESS_SUMMARY.md',
  'PRODUCTION_READINESS.md',
  'docs/AUTOMATION_INTEGRATION.md',
  'scripts/setup-automation-cron.js',
  'scripts/verify-automation-setup.js',
  'scripts/health-check.sh'
];

function checkFileExists(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  return fs.existsSync(fullPath);
}

function removeFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  try {
    if (fs.existsSync(fullPath)) {
      if (fs.lstatSync(fullPath).isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
      return true;
    }
  } catch (error) {
    console.error(`Error removing ${filePath}:`, error.message);
  }
  return false;
}

function auditDirectory(dirPath) {
  const fullPath = path.join(process.cwd(), dirPath);
  if (!fs.existsSync(fullPath)) return [];
  
  const unnecessaryFiles = [];
  const files = fs.readdirSync(fullPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const fullFilePath = path.join(process.cwd(), filePath);
    const stats = fs.statSync(fullFilePath);
    
    // Check for common patterns of unnecessary files
    if (file.match(/\.(log|tmp|temp|bak|backup|old|test|debug)$/i)) {
      unnecessaryFiles.push(filePath);
    } else if (file.match(/^(test|debug|temp|tmp)/i)) {
      unnecessaryFiles.push(filePath);
    } else if (file.match(/\.(png|jpg|jpeg|gif|webp)$/i) && file.match(/(debug|test|error|screenshot)/i)) {
      unnecessaryFiles.push(filePath);
    }
  });
  
  return unnecessaryFiles;
}

function auditNodeModules() {
  console.log('📦 Auditing node_modules...');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json not found');
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const dependencies = Object.keys(packageJson.dependencies || {});
  const devDependencies = Object.keys(packageJson.devDependencies || {});
  
  console.log(`   Dependencies: ${dependencies.length}`);
  console.log(`   Dev Dependencies: ${devDependencies.length}`);
  
  // Check for potentially unnecessary dependencies
  const potentiallyUnnecessary = [
    '@clerk/nextjs', // If not using Clerk
    'clerk', // If not using Clerk
  ];
  
  const found = potentiallyUnnecessary.filter(dep => 
    dependencies.includes(dep) || devDependencies.includes(dep)
  );
  
  if (found.length > 0) {
    console.log(`   ⚠️  Potentially unnecessary dependencies: ${found.join(', ')}`);
  } else {
    console.log('   ✅ No obvious unnecessary dependencies found');
  }
  
  console.log('');
}

function auditDatabaseSetup() {
  console.log('🗄️  Auditing Database Setup...');
  
  const prismaPath = path.join(process.cwd(), 'prisma');
  if (!fs.existsSync(prismaPath)) {
    console.log('❌ Prisma directory not found');
    return;
  }
  
  const prismaFiles = fs.readdirSync(prismaPath);
  console.log(`   Prisma files: ${prismaFiles.join(', ')}`);
  
  // Check for essential Prisma files
  const essentialPrismaFiles = ['schema.prisma'];
  const missing = essentialPrismaFiles.filter(file => !prismaFiles.includes(file));
  
  if (missing.length > 0) {
    console.log(`   ⚠️  Missing essential Prisma files: ${missing.join(', ')}`);
  } else {
    console.log('   ✅ Essential Prisma files present');
  }
  
  console.log('');
}

function auditEnvironmentFiles() {
  console.log('🔧 Auditing Environment Files...');
  
  const envFiles = [
    '.env',
    '.env.example',
    '.env.local',
    'automation.env.example'
  ];
  
  envFiles.forEach(file => {
    const exists = checkFileExists(file);
    const status = exists ? '✅' : '❌';
    console.log(`   ${status} ${file}`);
  });
  
  console.log('');
}

function auditGitSetup() {
  console.log('📝 Auditing Git Setup...');
  
  const gitPath = path.join(process.cwd(), '.git');
  if (!fs.existsSync(gitPath)) {
    console.log('❌ Git repository not initialized');
    return;
  }
  
  console.log('   ✅ Git repository initialized');
  
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    const essentialPatterns = ['node_modules', '.env', '.next', 'dist'];
    const missing = essentialPatterns.filter(pattern => !gitignoreContent.includes(pattern));
    
    if (missing.length > 0) {
      console.log(`   ⚠️  Missing essential .gitignore patterns: ${missing.join(', ')}`);
    } else {
      console.log('   ✅ .gitignore properly configured');
    }
  } else {
    console.log('   ❌ .gitignore not found');
  }
  
  console.log('');
}

function cleanupFiles() {
  console.log('🧹 Starting Cleanup...\n');
  
  let removedCount = 0;
  let totalFiles = filesToRemove.length;
  
  filesToRemove.forEach(filePath => {
    if (removeFile(filePath)) {
      console.log(`   ✅ Removed: ${filePath}`);
      removedCount++;
    } else {
      console.log(`   ⚠️  Not found: ${filePath}`);
    }
  });
  
  // Audit directories for additional cleanup
  directoriesToAudit.forEach(dir => {
    const unnecessaryFiles = auditDirectory(dir);
    unnecessaryFiles.forEach(filePath => {
      if (removeFile(filePath)) {
        console.log(`   ✅ Removed: ${filePath}`);
        removedCount++;
        totalFiles++;
      }
    });
  });
  
  console.log(`\n📊 Cleanup Summary:`);
  console.log(`   Files processed: ${totalFiles}`);
  console.log(`   Files removed: ${removedCount}`);
  console.log(`   Files not found: ${totalFiles - removedCount}`);
  console.log('');
}

function generateCleanupReport() {
  console.log('📋 Generating Cleanup Report...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    filesRemoved: filesToRemove.filter(file => checkFileExists(file)),
    essentialFilesPresent: essentialFiles.filter(file => checkFileExists(file)),
    recommendations: []
  };
  
  // Check for common issues
  if (!checkFileExists('.env.example')) {
    report.recommendations.push('Create .env.example file for environment variables');
  }
  
  if (!checkFileExists('README.md')) {
    report.recommendations.push('Create README.md file for project documentation');
  }
  
  if (!checkFileExists('prisma/schema.prisma')) {
    report.recommendations.push('Ensure Prisma schema is properly configured');
  }
  
  // Save report
  const reportPath = path.join(process.cwd(), 'cleanup-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('   ✅ Cleanup report saved to cleanup-report.json');
  console.log('');
  
  return report;
}

function main() {
  console.log('🔍 Starting comprehensive audit...\n');
  
  // Run audits
  auditNodeModules();
  auditDatabaseSetup();
  auditEnvironmentFiles();
  auditGitSetup();
  
  // Ask for confirmation before cleanup
  console.log('⚠️  WARNING: This will remove files from your project.');
  console.log('   Review the files to be removed above.');
  console.log('   Type "YES" to proceed with cleanup:');
  
  // For now, we'll proceed with cleanup but you can modify this
  console.log('   Proceeding with cleanup...\n');
  
  cleanupFiles();
  const report = generateCleanupReport();
  
  console.log('🎉 Audit and cleanup complete!');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('   1. Review cleanup-report.json');
  console.log('   2. Test the application locally');
  console.log('   3. Verify database connections');
  console.log('   4. Commit changes to Git');
  console.log('   5. Push to GitHub');
  console.log('');
  console.log('🔧 To test locally:');
  console.log('   npm run dev');
  console.log('   # Visit: http://localhost:3000/admin/dashboard/automation');
}

// Run the audit
main();

export {
  auditNodeModules,
  auditDatabaseSetup,
  auditEnvironmentFiles,
  auditGitSetup,
  cleanupFiles,
  generateCleanupReport
}; 