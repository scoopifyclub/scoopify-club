#!/usr/bin/env node

/**
 * Vercel Environment Variables Setup Helper
 * This script outputs all environment variables in a copy-paste format for Vercel
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Vercel Environment Variables Setup Helper');
console.log('============================================\n');

// Read environment files
const envPath = path.join(__dirname, '..', '.env');
const envLocalPath = path.join(__dirname, '..', '.env.local');

let envVars = {};

// Read .env file
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').replace(/"/g, '');
      if (key && value && value !== 'your_real_*' && !value.includes('your-')) {
        envVars[key.trim()] = value.trim();
      }
    }
  });
}

// Read .env.local file (overrides .env)
if (fs.existsSync(envLocalPath)) {
  const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
  envLocalContent.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').replace(/"/g, '');
      if (key && value && value !== 'your_real_*' && !value.includes('your-')) {
        envVars[key.trim()] = value.trim();
      }
    }
  });
}

// Critical environment variables for production
const criticalVars = [
  'DATABASE_URL',
  'DIRECT_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'NEXTAUTH_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'EMAIL_FROM',
  'GOOGLE_MAPS_API_KEY',
  'CRON_SECRET',
  'ADMIN_EMAIL'
];

console.log('📋 CRITICAL Environment Variables for Vercel:\n');
console.log('Copy and paste these into Vercel Dashboard > Settings > Environment Variables:\n');

criticalVars.forEach(varName => {
  if (envVars[varName]) {
    console.log(`${varName}=${envVars[varName]}`);
  } else {
    console.log(`❌ ${varName}: MISSING - This will cause production to fail!`);
  }
});

console.log('\n🔧 How to Add These in Vercel:');
console.log('1. Go to: https://vercel.com/dashboard');
console.log('2. Select your "Scoopify Club" project');
console.log('3. Click "Settings" tab');
console.log('4. Click "Environment Variables" in the left sidebar');
console.log('5. Click "Add New" button');
console.log('6. Copy each line above (e.g., "DATABASE_URL=postgres://...")');
console.log('7. Paste into the "Name" field (everything before the =)');
console.log('8. Paste the value into the "Value" field (everything after the =)');
console.log('9. Select "Production" environment');
console.log('10. Click "Save"');
console.log('11. Repeat for each variable');
console.log('12. Redeploy your project');

console.log('\n⚠️  IMPORTANT:');
console.log('- Make sure to select "Production" environment for each variable');
console.log('- After adding all variables, trigger a new deployment');
console.log('- The 404 errors should disappear once these are set');

export { envVars, criticalVars };
