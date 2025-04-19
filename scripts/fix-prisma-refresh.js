// scripts/fix-prisma-refresh.js
// This script forces a refresh of the Prisma client and server

const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 Refreshing Prisma client...');

try {
  // Force regenerate the Prisma client
  console.log('\n1️⃣ Regenerating Prisma client');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Clear any Node.js module cache
  console.log('\n2️⃣ Clearing module cache');
  Object.keys(require.cache).forEach(function(key) {
    if (key.includes('@prisma') || key.includes('prisma')) {
      delete require.cache[key];
    }
  });
  
  console.log('\n✅ Prisma client refreshed successfully!');
  console.log('You may need to restart your application for changes to take effect.');
  
} catch (error) {
  console.error('\n❌ Error refreshing Prisma client:', error);
  process.exit(1);
} 