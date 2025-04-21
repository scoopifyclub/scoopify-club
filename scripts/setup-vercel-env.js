// scripts/setup-vercel-env.js
// This script helps prepare environment variables for Vercel deployment

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🔑 Setting up Vercel environment variables...');

// Get the production environment variables from .env.production
const envPath = path.join(__dirname, '../.env.production');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.production file not found! Please create it first.');
  process.exit(1);
}

// Read the environment variables
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n').filter(line => {
  // Filter out comments and empty lines
  return line.trim() !== '' && !line.trim().startsWith('#');
});

// Parse the environment variables
const envVars = {};
envLines.forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
    envVars[key] = value;
  }
});

console.log(`Found ${Object.keys(envVars).length} environment variables to set.`);

// Check if Vercel CLI is installed
exec('vercel --version', (error) => {
  if (error) {
    console.error('❌ Vercel CLI not found! Please install it with: npm i -g vercel');
    process.exit(1);
  }

  console.log('✅ Vercel CLI detected');
  console.log('🔄 Adding environment variables to Vercel...');

  // Automatically log in to Vercel if needed
  exec('vercel', (error) => {
    if (error) {
      console.error('❌ Failed to authenticate with Vercel:', error.message);
      process.exit(1);
    }

    // Add environment variables to Vercel
    Object.entries(envVars).forEach(([key, value]) => {
      const command = `vercel env add ${key}`;
      console.log(`Adding ${key}...`);
      
      // We use execSync here to make sure environment variables are added sequentially
      const { spawn } = require('child_process');
      const child = spawn('vercel', ['env', 'add', key], { 
        stdio: ['pipe', 'inherit', 'inherit'] 
      });
      
      // Send the value to stdin when prompted
      child.stdin.write(`${value}\n`);
      child.stdin.end();
    });

    console.log('✅ Environment variables added to Vercel');
    console.log('🚀 You can now deploy your app with: vercel');
  });
}); 