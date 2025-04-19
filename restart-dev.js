const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Restarting development server with environment variables...');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ Found .env.local file');
} else {
  console.error('❌ .env.local file not found!');
  process.exit(1);
}

// Kill any running Next.js processes
try {
  console.log('🛑 Stopping any running Next.js servers...');
  execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
} catch (error) {
  // It's ok if this fails
}

// Start the dev server with environment variables
console.log('🚀 Starting development server...');
try {
  execSync('npm run dev', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to start server:', error);
} 