#!/usr/bin/env node

const { execSync } = require('child_process');
const { exit } = require('process');

const isProd = process.argv.includes('--production');

async function main() {
  try {
    // Install Vercel CLI if not already installed
    try {
      execSync('vercel --version', { stdio: 'ignore' });
    } catch {
      console.log('📦 Installing Vercel CLI...');
      execSync('npm i -g vercel@latest', { stdio: 'inherit' });
    }

    // Deploy to Vercel
    console.log(`🚀 Deploying to Vercel ${isProd ? '(production)' : '(preview)'}...`);
    
    const command = isProd 
      ? 'vercel --prod'
      : 'vercel';
    
    execSync(command, { stdio: 'inherit' });
    
    console.log('✅ Deployment successful!');
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    exit(1);
  }
}

main(); 