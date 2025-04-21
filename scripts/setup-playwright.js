#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎭 Setting up Playwright for testing...');

try {
  // Install Playwright browsers
  console.log('\nInstalling Playwright browsers...');
  execSync('npx playwright install --with-deps chromium', { stdio: 'inherit' });
  
  // Create auth directory if it doesn't exist
  const authDir = path.join(__dirname, '..', '.auth');
  if (!fs.existsSync(authDir)) {
    console.log('\nCreating .auth directory...');
    fs.mkdirSync(authDir, { recursive: true });
  }
  
  // Create test-results directory if it doesn't exist
  const resultsDir = path.join(__dirname, '..', 'test-results');
  if (!fs.existsSync(resultsDir)) {
    console.log('\nCreating test-results directory...');
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(resultsDir, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    console.log('\nCreating screenshots directory...');
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('\n✅ Playwright setup completed successfully!');
  console.log('\nYou can now run tests with:');
  console.log('  npm run test:e2e');
  console.log('  npm run test:e2e:ui');
  console.log('  npx playwright test e2e/basic.spec.ts');
} catch (error) {
  console.error('\n❌ Error setting up Playwright:', error.message);
  process.exit(1);
} 